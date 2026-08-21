-- FUSE VOID | Universal ID Database Schema
-- Cloudflare D1 (SQLite)

-- 1. Kullanıcılar Tablosu (Universal ID)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    subscription_id TEXT,
    subscription_status TEXT,
    plan_name TEXT,
    monthly_allowance INTEGER DEFAULT 0,
    next_reset_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Krediler Tablosu (Dakikalar)
CREATE TABLE IF NOT EXISTS credits (
    user_id TEXT PRIMARY KEY,
    monthly_minutes REAL DEFAULT 0,
    token_minutes REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Kullanım Kayıtları (Kim, ne zaman, kaç dakikalık işlem yaptı?)
CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    minutes_deducted INTEGER NOT NULL,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Ödeme Logları (Lemon Squeezy'den gelen ödemeler)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    minutes_added INTEGER NOT NULL,
    amount_usd REAL NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. OTP Geçici Kodları (Passwordless Login)
CREATE TABLE IF NOT EXISTS otps (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);

-- 5. Energy Tokens (365 Gün Kuralı)
CREATE TABLE IF NOT EXISTS energy_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    minutes REAL NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. İşlemler (Jobs) - Tombstone & Fencing Token Kalkanı
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY, -- FUSE_TX_ID
    user_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'processing', 'completed', 'refunded_timeout', 'cancelled'
    result_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
