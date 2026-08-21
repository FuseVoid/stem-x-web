// FUSE VOID | Cloudflare Worker (Middleware API)
// Handles Auth, D1 Database, and secure RunPod connection.

import { AwsClient } from 'aws4fetch';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper: Basic SHA-256 Hashing for passwords (since standard bcrypt requires native node modules)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "FUSE_VOID_SECRET_SALT_123");
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Basic UUID generator
function generateUUID() {
    return crypto.randomUUID();
}

// Helper: Generate simple JWT-like token (Base64 encoded for MVP, real JWT uses HMAC signing)
async function generateToken(userId, email) {
    const payload = { userId, email, exp: Date.now() + 86400000 }; // 24 hours
    return btoa(JSON.stringify(payload));
}

// Validate Token
function validateToken(token) {
    try {
        const payload = JSON.parse(atob(token));
        if (payload.exp < Date.now()) throw new Error("Token expired");
        return payload;
    } catch (e) {
        return null;
    }
}

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        try {
            // ROUTE: /api/auth/send-code
            if (request.method === "POST" && url.pathname === "/api/auth/send-code") {
                const { email } = await request.json();
                if (!email) throw new Error("Missing email");

                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

                await env.DB.prepare("INSERT OR REPLACE INTO otps (email, code, expires_at) VALUES (?, ?, ?)")
                    .bind(email, code, expiresAt)
                    .run();

                console.log(`[SECURE OTP GENERATED] Email: ${email} | Code: ${code}`);

                // Send email via Resend API
                const emailReq = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'FUSE VOID SECURITY <noreply@fusevoid.com>',
                        reply_to: 'support@fusevoid.com',
                        to: [email],
                        subject: 'FUSE VOID | Secure Access Code',
                        html: `
                            <div style="background:#0a0a0a; color:#00f3ff; padding:40px; font-family:monospace; text-align:center; border: 1px solid #00f3ff;">
                                <h1 style="letter-spacing:4px; margin-bottom:20px;">FUSE VOID</h1>
                                <p>Your secure access code is:</p>
                                <h2 style="font-size:36px; background:#00f3ff; color:#000; padding:15px; display:inline-block;">${code}</h2>
                                <p style="margin-top:20px; color:#888;">This code expires in 5 minutes.</p>
                            </div>
                        `
                    })
                });

                if (!emailReq.ok) {
                    const errorText = await emailReq.text();
                    console.error("Resend Error:", errorText);
                    return new Response(JSON.stringify({ error: "Failed to send email", details: errorText }), { status: 500, headers: corsHeaders });
                }

                return new Response(JSON.stringify({ success: true, message: "Code sent" }), { headers: corsHeaders });
            }

            // ROUTE: /api/auth/verify-code
            if (request.method === "POST" && url.pathname === "/api/auth/verify-code") {
                const { email, code } = await request.json();
                if (!email || !code) throw new Error("Missing email or code");

                const otpRecord = await env.DB.prepare("SELECT * FROM otps WHERE email = ? AND code = ?")
                    .bind(email, code)
                    .first();

                if (!otpRecord) {
                    return new Response(JSON.stringify({ error: "Invalid Code" }), { status: 401, headers: corsHeaders });
                }

                if (new Date(otpRecord.expires_at) < new Date()) {
                    return new Response(JSON.stringify({ error: "Code Expired" }), { status: 401, headers: corsHeaders });
                }

                // Code is valid. Delete it.
                await env.DB.prepare("DELETE FROM otps WHERE email = ?").bind(email).run();

                // Check if user exists
                let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
                let userId;

                if (!user) {
                    userId = generateUUID();
                    // Create user with dummy password_hash since it's passwordless
                    await env.DB.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)")
                        .bind(userId, email, "PASSWORDLESS")
                        .run();
                    
                    // Give 0 credits using the new split columns
                    await env.DB.prepare("INSERT INTO credits (user_id, monthly_minutes, token_minutes) VALUES (?, ?, ?)")
                        .bind(userId, 0, 0)
                        .run();
                } else {
                    userId = user.id;
                }

                const credits = await env.DB.prepare("SELECT monthly_minutes, token_minutes FROM credits WHERE user_id = ?").bind(userId).first();
                const totalMins = credits ? (credits.monthly_minutes + credits.token_minutes) : 0;
                const token = await generateToken(userId, email);

                return new Response(JSON.stringify({ 
                    success: true, 
                    token, 
                    minutes: totalMins
                }), { headers: corsHeaders });
            }

            // ROUTE: /api/upload-url (Generate R2 Presigned URL)
            if (request.method === "POST" && url.pathname === "/api/upload-url") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
                
                const token = authHeader.split(" ")[1];
                const payload = validateToken(token);
                if (!payload) return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401, headers: corsHeaders });

                const { filename } = await request.json();
                if (!filename) return new Response(JSON.stringify({ error: "Filename required" }), { status: 400, headers: corsHeaders });

                const fileExt = filename.split('.').pop();
                const fileKey = `${payload.userId}_${Date.now()}.${fileExt}`;

                const aws = new AwsClient({
                    accessKeyId: env.R2_ACCESS_KEY_ID,
                    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
                    service: 's3',
                    region: 'auto',
                });

                const signUrl = new URL(`${env.R2_ENDPOINT_URL}/${env.R2_BUCKET_NAME}/${fileKey}`);
                const signedRequest = await aws.sign(signUrl, {
                    method: 'PUT',
                    aws: { signQuery: true }
                });

                return new Response(JSON.stringify({ 
                    upload_url: signedRequest.url, 
                    file_key: fileKey 
                }), { headers: corsHeaders });
            }

            // ROUTE: /api/process (RunPod v9 Bridge)
            if (request.method === "POST" && url.pathname === "/api/process") {
                // 1. Verify Authorization
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
                }
                const token = authHeader.split(" ")[1];
                const payload = validateToken(token);
                if (!payload) {
                    return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401, headers: corsHeaders });
                }

                // 2. Determine Minutes to Deduct
                const { filename, duration } = await request.json(); 
                
                // If duration is not provided or invalid, fallback to 1 minute to prevent free bypass
                let minutesToDeduct = 1.0;
                if (duration && typeof duration === 'number' && duration > 0) {
                    minutesToDeduct = Math.ceil(duration / 60);
                }

                // 3. FIFO Token Kesintisi & ATOMIC BATCH UPDATE (Race Condition Koruması - V9.3 FinOps)
                // Mevcut krediyi oku
                const currentCredits = await env.DB.prepare("SELECT monthly_minutes, token_minutes FROM credits WHERE user_id = ?").bind(payload.userId).first();
                if (!currentCredits || (currentCredits.monthly_minutes + currentCredits.token_minutes) < minutesToDeduct) {
                    return new Response(JSON.stringify({ error: "Insufficient minutes" }), { status: 402, headers: corsHeaders });
                }

                let tokensToDeduct = 0;
                let monthlyToDeduct = minutesToDeduct;
                if (currentCredits.monthly_minutes < minutesToDeduct) {
                    tokensToDeduct = minutesToDeduct - currentCredits.monthly_minutes;
                    monthlyToDeduct = currentCredits.monthly_minutes;
                }

                const batchStatements = [];

                if (tokensToDeduct > 0) {
                    // FIFO: En eski tokenleri getir (Tarihi en eski olan en once harcanir)
                    const validTokens = await env.DB.prepare("SELECT * FROM energy_tokens WHERE user_id = ? AND expires_at > datetime('now') ORDER BY expires_at ASC").bind(payload.userId).all();
                    
                    let remainingToDeduct = tokensToDeduct;
                    if (validTokens && validTokens.results) {
                        for (const token of validTokens.results) {
                            if (remainingToDeduct <= 0) break;
                            
                            if (token.minutes <= remainingToDeduct) {
                                // Bu tokenin tamamı bitti, faturayi sil!
                                batchStatements.push(env.DB.prepare("DELETE FROM energy_tokens WHERE id = ?").bind(token.id));
                                remainingToDeduct -= token.minutes;
                            } else {
                                // Bu tokenden bir kısmı düşülecek, faturayi guncelle!
                                batchStatements.push(env.DB.prepare("UPDATE energy_tokens SET minutes = minutes - ? WHERE id = ?").bind(remainingToDeduct, token.id));
                                remainingToDeduct = 0;
                            }
                        }
                    }
                }

                // Ana Kasayı güncelle
                batchStatements.push(env.DB.prepare(`
                    UPDATE credits
                    SET 
                        token_minutes = CASE 
                            WHEN monthly_minutes >= ? THEN token_minutes 
                            ELSE token_minutes - (? - monthly_minutes) 
                        END,
                        monthly_minutes = CASE 
                            WHEN monthly_minutes >= ? THEN monthly_minutes - ? 
                            ELSE 0 
                        END
                    WHERE user_id = ? AND (monthly_minutes + token_minutes) >= ?
                `).bind(
                    minutesToDeduct, minutesToDeduct, 
                    minutesToDeduct, minutesToDeduct, 
                    payload.userId, minutesToDeduct
                ));

                try {
                    await env.DB.batch(batchStatements);
                } catch (error) {
                    console.error("Batch Transaction Error:", error);
                    return new Response(JSON.stringify({ error: "Transaction failed" }), { status: 500, headers: corsHeaders });
                }

                const currentMinutes = (currentCredits.monthly_minutes + currentCredits.token_minutes) - minutesToDeduct;

                // 4. Forward to RunPod v9 API
                const file_key = filename || "test.mp3"; 
                const fuse_tx_id = generateUUID();

                // FENCING TOKEN ZIRHI: İşi sıraya almadan önce DB'ye yaz (Idempotency Shield)
                await env.DB.prepare("INSERT INTO jobs (id, user_id, status) VALUES (?, ?, 'processing')")
                    .bind(fuse_tx_id, payload.userId)
                    .run();

                const runpodPayload = {
                    input: {
                        file_key: file_key,
                        job_id: fuse_tx_id, // Custom job_id instead of RunPod's
                        mode: "fiveStem",
                        web_secret: env.FUSE_VOID_WEB_SECRET,
                        r2_access_key: env.R2_ACCESS_KEY_ID,
                        r2_secret_key: env.R2_SECRET_ACCESS_KEY,
                        r2_endpoint: env.R2_ENDPOINT_URL,
                        r2_bucket: env.R2_BUCKET_NAME
                    }
                };

                try {
                    // Timeout (20 saniye) kalkanı
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 20000);

                    const runpodRes = await fetch(`https://api.runpod.ai/v2/${env.RUNPOD_ENDPOINT_ID}/run`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${env.RUNPOD_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(runpodPayload),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    const runpodData = await runpodRes.json();
                    
                    if (!runpodRes.ok) {
                        throw new Error("RunPod API Error: " + JSON.stringify(runpodData));
                    }

                    // V9 MİMARİSİ: RunPod'un gerçek ID'sini veritabanına mühürle (Kimlik Senkronizasyonu)
                    await env.DB.prepare("UPDATE jobs SET id = ? WHERE id = ?")
                        .bind(runpodData.id, fuse_tx_id)
                        .run();

                    return new Response(JSON.stringify({ 
                        success: true, 
                        message: "Signal sent to RunPod securely.", 
                        job_id: runpodData.id, // Müşteriye (ve poll status'a) RunPod'un gerçek ID'sini veriyoruz
                        remaining_minutes: currentMinutes
                    }), { headers: corsHeaders });
                    
                } catch (error) {
                    console.error("RunPod Crash/Timeout!", error);
                    
                    // V8 MİMARİSİ: İdempotency Kalkanı Devrede!
                    // Eğer Timeout veya Ağ kopması yaşandıysa kredi İADE EDİLMEZ.
                    // İşlem veritabanında 'unknown_timeout' statüsüne alınır.
                    await env.DB.prepare("UPDATE jobs SET status = 'unknown_timeout' WHERE id = ?")
                        .bind(fuse_tx_id)
                        .run();
                        
                    return new Response(JSON.stringify({ 
                        error: "Ağ yoğunluğu var. İstek işleniyor olabilir. Lütfen durumunu kontrol edin.",
                        job_id: fuse_tx_id
                    }), { status: 504, headers: corsHeaders });

                }
            }

            // ROUTE: /api/auth/me (Get Current Balance)
            if (request.method === "GET" && url.pathname === "/api/auth/me") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
                
                const token = authHeader.split(" ")[1];
                const payload = validateToken(token);
                if (!payload) return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401, headers: corsHeaders });

                const credits = await env.DB.prepare("SELECT monthly_minutes, token_minutes FROM credits WHERE user_id = ?")
                    .bind(payload.userId)
                    .first();

                return new Response(JSON.stringify({ 
                    success: true, 
                    minutes: credits ? (credits.monthly_minutes + credits.token_minutes) : 0 
                }), { headers: corsHeaders });
            }

            // ROUTE: /api/status (Poll Job Status)
            if (request.method === "POST" && url.pathname === "/api/status") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
                
                const token = authHeader.split(" ")[1];
                if (!validateToken(token)) return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401, headers: corsHeaders });

                const { job_id } = await request.json();
                if (!job_id) return new Response(JSON.stringify({ error: "job_id required" }), { status: 400, headers: corsHeaders });

                // Önce D1'e bak! (Fencing Token / Tombstone kalkanı devrede)
                const job = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(job_id).first();
                if (!job) {
                    return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: corsHeaders });
                }

                if (job.status === 'completed') {
                    return new Response(JSON.stringify({ 
                        status: "COMPLETED", 
                        stems: JSON.parse(job.result_url || "{}")
                    }), { headers: corsHeaders });
                } else if (job.status === 'refunded_timeout' || job.status === 'cancelled') {
                    return new Response(JSON.stringify({ error: "Job Failed or Cancelled." }), { status: 500, headers: corsHeaders });
                }

                // Eger RunPod bitirmemişse ve veritabanı hala 'processing' ise RunPod'a sor.
                try {
                    const rpRes = await fetch(`https://api.runpod.ai/v2/${env.RUNPOD_ENDPOINT_ID}/status/${job_id}`, {
                        method: "GET",
                        headers: { "Authorization": `Bearer ${env.RUNPOD_API_KEY}` }
                    });
                    
                    const rpData = await rpRes.json();
                    
                    if (rpData.status === "COMPLETED") {
                        // Güvenlik Ağı: RunPod bitirmiş ama DB güncellenmemişse (Callback patlamışsa), DB'yi şimdi güncelle (Fencing Token zırhıyla)
                        await env.DB.prepare("UPDATE jobs SET status = 'completed', result_url = ? WHERE id = ? AND status = 'processing'")
                            .bind(JSON.stringify(rpData.output.stems), job_id)
                            .run();

                        return new Response(JSON.stringify({ 
                            status: "COMPLETED", 
                            stems: rpData.output.stems
                        }), { headers: corsHeaders });
                    } else if (rpData.status === "FAILED") {
                        await env.DB.prepare("UPDATE jobs SET status = 'cancelled' WHERE id = ?").bind(job_id).run();
                        return new Response(JSON.stringify({ error: "Job Failed: " + JSON.stringify(rpData.error) }), { status: 500, headers: corsHeaders });
                    } else {
                        return new Response(JSON.stringify({ status: rpData.status }), { headers: corsHeaders });
                    }
                } catch(e) {
                    // Eğer Timeout olmuşsa ('unknown_timeout' durumu), RunPod API'sine ulaşılamamış olabilir.
                    return new Response(JSON.stringify({ status: "IN_QUEUE" }), { headers: corsHeaders });
                }
            }

            // ROUTE: /api/checkout-url (Generate Lemon Squeezy Checkout Link)
            if (request.method === "POST" && url.pathname === "/api/checkout-url") {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader || !authHeader.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
                
                const token = authHeader.split(" ")[1];
                const payload = validateToken(token);
                if (!payload) return new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401, headers: corsHeaders });

                const { variant_id } = await request.json();
                if (!variant_id) return new Response(JSON.stringify({ error: "Variant ID required" }), { status: 400, headers: corsHeaders });

                // Map integer Variant IDs to Lemon Squeezy Checkout UUIDs
                const checkoutLinks = {
                    "1285954": "c048051d-a18c-4f1a-bbae-5f4b5305318e", // Basic Monthly
                    "1285980": "9f4182b2-bb5a-4931-ace2-cd4862a690b9", // Basic Yearly
                    "1286002": "631ea6c9-834b-47c6-b5ba-cc3a6c0697b3", // Pro Monthly
                    "1286027": "e39a9f81-6502-4dbc-84b1-6f9dce7f6b9c", // Pro Yearly
                    "1286043": "b94f3172-e19d-4109-96f5-8cf36365b946"  // Energy Token
                };

                const checkoutUuid = checkoutLinks[String(variant_id)] || variant_id;

                // Construct Lemon Squeezy URL with custom user_id tracking
                const checkoutUrl = `https://fusevoid.lemonsqueezy.com/checkout/buy/${checkoutUuid}?checkout[custom][user_id]=${payload.userId}`;
                
                return new Response(JSON.stringify({ success: true, url: checkoutUrl }), { headers: corsHeaders });
            }

            // ROUTE: /api/webhooks/lemonsqueezy
            if (request.method === "POST" && url.pathname === "/api/webhooks/lemonsqueezy") {
                
                const signature = request.headers.get("X-Signature");
                const bodyText = await request.text();

                // 1. HMAC SHA-256 Validation (Saldırganı Pişman Etme Protokolü)
                if (!signature) return new Response("Missing Signature", { status: 401 });
                
                const encoder = new TextEncoder();
                const key = await crypto.subtle.importKey(
                    "raw",
                    encoder.encode(env.LEMON_SQUEEZY_WEBHOOK_SECRET),
                    { name: "HMAC", hash: "SHA-256" },
                    false,
                    ["sign"]
                );
                const hash = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyText));
                const hexSignature = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');

                if (hexSignature !== signature) {
                    console.log("[SECURITY WARNING] Invalid Lemon Squeezy Webhook Signature!");
                    return new Response("Invalid Signature", { status: 401 });
                }

                // 2. Parse Event
                const event = JSON.parse(bodyText);
                const eventName = event.meta.event_name;
                
                if (eventName === 'subscription_expired' || eventName === 'subscription_payment_failed') {
                    const userId = event.meta.custom_data?.user_id;
                    if (userId) {
                        await env.DB.prepare("UPDATE users SET monthly_allowance = 0 WHERE id = ?").bind(userId).run();
                        await env.DB.prepare("UPDATE credits SET monthly_minutes = 0 WHERE user_id = ?").bind(userId).run();
                        console.log(`[SUBSCRIPTION EXPIRED] Removed monthly allowance and zeroed out monthly_minutes for user ${userId}`);
                    }
                    return new Response("Subscription ended", { status: 200 });
                }
                
                if (eventName === 'subscription_cancelled') {
                    console.log(`[SUBSCRIPTION CANCELLED] User ${event.meta.custom_data?.user_id} cancelled but retains access until billing cycle ends.`);
                    return new Response("Subscription cancelled noted", { status: 200 });
                }
                
                if (eventName === 'order_created' || eventName === 'subscription_created' || eventName === 'subscription_updated' || eventName === 'subscription_payment_success') {
                    const userId = event.meta.custom_data?.user_id;
                    const orderId = event.data.id;
                    const status = event.data.attributes.status;
                    const amountUsd = event.data.attributes.total_usd / 100 || 0; // if provided

                    // Sadece basarili ödemeleri/aktif abonelikleri isliyoruz
                    if (status !== 'paid' && status !== 'active') {
                        return new Response("Order/Subscription not paid yet", { status: 200 });
                    }

                    if (!userId) {
                        console.log(`[WARNING] Order/Subscription ${orderId} has no custom user_id attached.`);
                        return new Response("No user_id", { status: 200 });
                    }

                    // Variant ID'yi event tipine gore dinamik al
                    let variantId = "";
                    if (event.data.attributes.first_order_item) {
                        variantId = String(event.data.attributes.first_order_item.variant_id);
                    } else if (event.data.attributes.first_subscription_item) {
                        variantId = String(event.data.attributes.first_subscription_item.variant_id);
                    } else if (event.data.attributes.variant_id) {
                        variantId = String(event.data.attributes.variant_id);
                    } else {
                        // Eger invoice event (subscription_payment_success) geldiyse ve variant yoksa,
                        // en güvenli yol subscription_updated event'ini beklemektir.
                        console.log(`[INFO] Event ${eventName} variant ID barindirmiyor. Dunning icin subscription_updated bekleniyor.`);
                        return new Response("Skipped. Waiting for subscription_updated", { status: 200 });
                    }


                    // Calculate minutes based on Variant ID
                    let minutesToAdd = 0;
                    let isSubscription = false;
                    
                    if (variantId === "1286043" || variantId === "1930380" || variantId === "28d06974-8710-4214-a411-9e94d7aee744") {
                        minutesToAdd = 60;   // Energy Token
                    } else if (variantId === "1285954" || variantId === "1285980" || variantId === "1930425" || variantId === "54b0894d-e745-40c8-9d7b-46636b03565e" || variantId === "16bdd1c1-71c2-4c86-b1db-8d92e565401d") {
                        minutesToAdd = 120; // Basic Plan (Monthly & Yearly)
                        isSubscription = true;
                    } else if (variantId === "1286002" || variantId === "1286027" || variantId === "1930431" || variantId === "df342fd6-daae-458c-9c86-c17756377ffa" || variantId === "5b039d16-7b26-46a5-bcb7-95983c00ca80") {
                        minutesToAdd = 300; // Pro Plan (Monthly & Yearly)
                        isSubscription = true;
                    }

                    if (minutesToAdd > 0) {
                        try {
                            // Idempotency Check: Log the payment to prevent double crediting
                            await env.DB.prepare("INSERT INTO payments (id, order_id, user_id, variant_id, minutes_added, amount_usd, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
                                .bind(generateUUID(), orderId, userId, variantId, minutesToAdd, amountUsd, status)
                                .run();

                            if (isSubscription) {
                                // V8 MİMARİSİ: SQL Three-Valued Logic Koruması (Bedava Premium Zafiyeti Kapandı)
                                // Eğer iptal edildiyse, renews_at yerine ends_at kullan. O da yoksa D1'in şimdiki zamanını kullan (Asla 1 ay hediye etme).
                                let nextResetISO;
                                if (event.data.attributes.renews_at) {
                                    nextResetISO = event.data.attributes.renews_at;
                                } else if (event.data.attributes.ends_at) {
                                    nextResetISO = event.data.attributes.ends_at;
                                } else {
                                    nextResetISO = new Date().toISOString(); 
                                }
                                
                                await env.DB.prepare("UPDATE credits SET monthly_minutes = ? WHERE user_id = ?")
                                    .bind(minutesToAdd, userId)
                                    .run();
                                
                                await env.DB.prepare("UPDATE users SET monthly_allowance = ?, next_reset_date = ? WHERE id = ?")
                                    .bind(minutesToAdd, nextResetISO, userId)
                                    .run();
                            } else {
                                // For Energy Tokens (365 Gün kuralı)
                                const expiryDate = new Date();
                                expiryDate.setDate(expiryDate.getDate() + 365);
                                const expiresAtISO = expiryDate.toISOString();
                                
                                await env.DB.prepare("INSERT INTO energy_tokens (id, user_id, minutes, expires_at) VALUES (?, ?, ?, ?)")
                                    .bind(generateUUID(), userId, minutesToAdd, expiresAtISO)
                                    .run();
                                
                                // Ayrıca genel krediye de ekle (Sadece token_minutes havuzuna)
                                await env.DB.prepare("UPDATE credits SET token_minutes = token_minutes + ? WHERE user_id = ?")
                                    .bind(minutesToAdd, userId)
                                    .run();
                            }
                            
                            console.log(`[SUCCESS] Added ${minutesToAdd} minutes to user ${userId} for order ${orderId}`);
                        } catch (err) {
                            if (err.message.includes("UNIQUE constraint failed")) {
                                console.log(`[IDEMPOTENCY] Order ${orderId} already processed.`);
                            } else {
                                console.log(`[ERROR] DB Insert Failed: ${err.message}`);
                                return new Response("Database Error", { status: 500 });
                            }
                        }
                    }
                }

                return new Response("OK", { status: 200 });
            }

            return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders });

        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
    },
    
    // Siber Zamanlayıcı (Cron Trigger)
    async scheduled(event, env, ctx) {
        console.log("[CRON] Zamanlayici calisti: " + new Date().toISOString());
        
        try {
            // next_reset_date'i bugunden kucuk/esit olan kullanicilari bul
            const now = new Date().toISOString();
            
            const query = `
                SELECT id, monthly_allowance, next_reset_date 
                FROM users 
                WHERE next_reset_date IS NOT NULL 
                AND next_reset_date <= ? 
                AND monthly_allowance > 0
            `;
            const { results } = await env.DB.prepare(query).bind(now).all();
            
            for (const user of results) {
                // Sifirlama tarihini tam 1 Takvim Ayı ileri at (Zaman kaymasi engellendi - Drift Fix)
                const nextReset = new Date(user.next_reset_date || now);
                nextReset.setMonth(nextReset.getMonth() + 1);
                const nextResetISO = nextReset.toISOString();
                
                // Kullanicinin sadece aylik kredisini sifirla, token_minutes havuzuna ASLA dokunma!
                await env.DB.prepare("UPDATE credits SET monthly_minutes = ? WHERE user_id = ?")
                    .bind(user.monthly_allowance, user.id)
                    .run();
                
                // Yeni ay donumunu kullaniciya kaydet (DB Time Authority kullanılıyor!)
                await env.DB.prepare("UPDATE users SET next_reset_date = datetime(next_reset_date, '+1 month') WHERE id = ?")
                    .bind(user.id)
                    .run();
                
                console.log(`[CRON] Kullanici ${user.id} icin dakikalar ${user.monthly_allowance} olarak yenilendi.`);
            }

            // V8 MİMARİSİ: TOMBSTONE (Sıkıyönetim Kuralı - 12 Saat TTL Zombileri)
            // 12 Saati geçmiş ve hala bitmemiş/askıda olan işlemleri meftun et ve müşteriye zorla iade yap!
            // Zaman Otoritesi JS Date() DEĞİL, Veritabanı Motorudur!
            const zombiJobs = await env.DB.prepare(`
                SELECT * FROM jobs 
                WHERE (status = 'processing' OR status = 'unknown_timeout')
                AND created_at < datetime('now', '-12 hours')
            `).all();

            if (zombiJobs && zombiJobs.results) {
                for (const job of zombiJobs.results) {
                    // 1. RunPod'a Tombstone / Cancel emri gönder (Bunu RunPod'un Cancel endpointine yapıyoruz, V2 API destekler)
                    try {
                        await fetch(`https://api.runpod.ai/v2/${env.RUNPOD_ENDPOINT_ID}/cancel/${job.id}`, {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${env.RUNPOD_API_KEY}` }
                        });
                    } catch(e) {
                        console.log("RunPod Tombstone failure, but proceeding to refund.");
                    }

                    // 2. Fencing Token ile Status'u İptal Edildi (Refunded) yap! (Atomic Update)
                    const res = await env.DB.prepare("UPDATE jobs SET status = 'refunded_timeout' WHERE id = ? AND (status = 'processing' OR status = 'unknown_timeout')")
                        .bind(job.id)
                        .run();

                    // Eğer update başarılıysa (Etkilenen satır > 0), parayı iade et
                    if (res.meta.changes > 0) {
                        // V8 ZORUNLU İADE (Max TTL)
                        await env.DB.prepare(`
                            UPDATE credits 
                            SET token_minutes = token_minutes + 1 -- Varsayılan 1 dk iade (Gerçek süreyi bilmiyoruz, 1 dk iade minimum)
                            WHERE user_id = ?
                        `).bind(job.user_id).run();
                        console.log(`[TOMBSTONE] Job ${job.id} zombi oldu (12 Saat Doldu). Müşteriye iade yapıldı.`);
                    }
                }
            }

            // YENI GOREV: 365 Günü Dolan Jetonları Temizle (V8 DB Time ile)
            const expiredTokens = await env.DB.prepare("SELECT * FROM energy_tokens WHERE expires_at <= datetime('now')").all();
            if (expiredTokens && expiredTokens.results) {
                for (const token of expiredTokens.results) {
                    // Orijinal token faturasi kalıcı silinmeden once icinde GERCEKTEN kac dakika kaldigini oku
                    // (Cunku FIFO algoritmasi token'in icindeki dakikalari surekli azaltti)
                    const remainingMinsInToken = token.minutes;
                    
                    if (remainingMinsInToken > 0) {
                        // Sadece harcanmamis artakalan kismi "token_minutes" havuzundan dus
                        await env.DB.prepare(`
                            UPDATE credits 
                            SET token_minutes = CASE 
                                WHEN token_minutes >= ? THEN token_minutes - ? 
                                ELSE 0 
                            END 
                            WHERE user_id = ?
                        `).bind(remainingMinsInToken, remainingMinsInToken, token.user_id).run();
                    }
                    
                    // Jetonu veritabanından kalıcı sil
                    await env.DB.prepare("DELETE FROM energy_tokens WHERE id = ?").bind(token.id).run();
                    console.log(`[CRON] Expired energy token ${token.id} removed for user ${token.user_id}`);
                }
            }
        } catch (err) {
            console.log("[CRON ERROR] " + err.message);
        }
    }
};
