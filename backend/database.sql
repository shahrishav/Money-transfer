IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'money_transfer')
BEGIN
  CREATE DATABASE money_transfer;
END
GO

USE money_transfer;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  full_name     NVARCHAR(100)  NOT NULL,
  email         NVARCHAR(150)  NOT NULL UNIQUE,
  password_hash NVARCHAR(255)  NOT NULL,
  is_active     BIT            NOT NULL DEFAULT 1,
  created_at    DATETIME       NOT NULL DEFAULT GETDATE(),
  updated_at    DATETIME       NOT NULL DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'otps')
CREATE TABLE otps (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  email      NVARCHAR(150) NOT NULL,
  otp_code   NVARCHAR(10)  NOT NULL,
  expires_at DATETIME      NOT NULL,
  is_used    BIT           NOT NULL DEFAULT 0,
  created_at DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'senders')
CREATE TABLE senders (
  id                 INT IDENTITY(1,1) PRIMARY KEY,
  user_id            INT            NOT NULL FOREIGN KEY REFERENCES users(id),
  full_name          NVARCHAR(100)  NOT NULL,
  phone              NVARCHAR(20)   NOT NULL,
  address            NVARCHAR(255)  NOT NULL,
  state              NVARCHAR(100)  NOT NULL,
  district           NVARCHAR(100)  NOT NULL,
  municipality       NVARCHAR(100)  NOT NULL,
  ward_number        NVARCHAR(10)   NOT NULL,
  date_of_birth      DATE           NOT NULL,
  id_number          NVARCHAR(50)   NOT NULL,
  id_issue_date      DATE           NOT NULL,
  father_spouse_name NVARCHAR(100)  NOT NULL,
  country            NVARCHAR(100)  NOT NULL DEFAULT 'Japan',
  is_active          BIT            NOT NULL DEFAULT 1,
  created_at         DATETIME       NOT NULL DEFAULT GETDATE(),
  updated_at         DATETIME       NOT NULL DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'receivers')
CREATE TABLE receivers (
  id                 INT IDENTITY(1,1) PRIMARY KEY,
  user_id            INT            NOT NULL FOREIGN KEY REFERENCES users(id),
  full_name          NVARCHAR(100)  NOT NULL,
  phone              NVARCHAR(20)   NOT NULL,
  bank_name          NVARCHAR(150)  NOT NULL,
  bank_account       NVARCHAR(50)   NOT NULL,
  address            NVARCHAR(255)  NOT NULL,
  state              NVARCHAR(100)  NOT NULL,
  district           NVARCHAR(100)  NOT NULL,
  municipality       NVARCHAR(100)  NOT NULL,
  ward_number        NVARCHAR(10)   NOT NULL,
  date_of_birth      DATE           NOT NULL,
  id_number          NVARCHAR(50)   NOT NULL,
  id_issue_date      DATE           NOT NULL,
  father_spouse_name NVARCHAR(100)  NOT NULL,
  country            NVARCHAR(100)  NOT NULL DEFAULT 'Nepal',
  is_active          BIT            NOT NULL DEFAULT 1,
  created_at         DATETIME       NOT NULL DEFAULT GETDATE(),
  updated_at         DATETIME       NOT NULL DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'transactions')
CREATE TABLE transactions (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  sender_id    INT             NOT NULL FOREIGN KEY REFERENCES senders(id),
  receiver_id  INT             NOT NULL FOREIGN KEY REFERENCES receivers(id),
  user_id      INT             NOT NULL FOREIGN KEY REFERENCES users(id),
  amount_jpy   DECIMAL(18,2)   NOT NULL,
  forex_rate   DECIMAL(10,4)   NOT NULL DEFAULT 0.92,
  amount_npr   DECIMAL(18,2)   NOT NULL,
  service_fee  DECIMAL(10,2)   NOT NULL,
  total_amount DECIMAL(18,2)   NOT NULL,
  pin_code     NVARCHAR(10)    NOT NULL DEFAULT '0000000000',
  pin_used     BIT             NOT NULL DEFAULT 0,
  status       NVARCHAR(20)    NOT NULL DEFAULT 'pending',
  paid_at      DATETIME        NULL,
  created_at   DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'receiver_claims')
CREATE TABLE receiver_claims (
  id                 INT IDENTITY(1,1) PRIMARY KEY,
  transaction_id     INT            NOT NULL FOREIGN KEY REFERENCES transactions(id),
  full_name          NVARCHAR(100)  NOT NULL,
  phone              NVARCHAR(20)   NOT NULL,
  bank_name          NVARCHAR(150)  NOT NULL,
  bank_account       NVARCHAR(50)   NOT NULL,
  address            NVARCHAR(255)  NOT NULL,
  state              NVARCHAR(100)  NOT NULL,
  district           NVARCHAR(100)  NOT NULL,
  municipality       NVARCHAR(100)  NOT NULL,
  ward_number        NVARCHAR(10)   NOT NULL,
  date_of_birth      DATE           NOT NULL,
  id_number          NVARCHAR(50)   NOT NULL,
  id_issue_date      DATE           NOT NULL,
  father_spouse_name NVARCHAR(100)  NOT NULL,
  created_at         DATETIME       NOT NULL DEFAULT GETDATE()
);
GO

PRINT 'All tables created successfully!';
GO