Create Database Voting 
Go
Use Voting
Go
CREATE TABLE Users (
  ID INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(100),
  Email NVARCHAR(100) UNIQUE,
  CCCD NVARCHAR(20),
  Password NVARCHAR(255)
);

Select * FROM Users

select * from Users

CREATE TABLE Employees
(
	EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
	FullName NVARCHAR(255) NOT NULL,
	CitizenID NVARCHAR(12) UNIQUE NOT NULL,
	Email NVARCHAR(100) UNIQUE NOT NULL, 
	Phone NVARCHAR(15),
	CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
CREATE TABLE RegisteredVoters (
    VoterID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    WalletAddress NVARCHAR(150),CitizenID NVARCHAR(12),
    RegisteredAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)

);
ALTER TABLE RegisteredVoters
ADD IsApproved BIT DEFAULT 0; -- 0 = Chưa duyệt, 1 = Đã duyệt

SELECT * FROM Employees

INSERT INTO Employees(FullName, CitizenID,Email,Phone)
VALUES (N'Hồ Đắc Khả',066205007315,'hodackha36@gmail.com',0941712219)

SELECT * FROM Employees
SELECT * FROM RegisteredVoters
SELECT * FROM Users

ALTER TABLE Employees
ALTER COLUMN CitizenID NVARCHAR(20);

UPDATE Employees
SET CitizenID = N'066205007315'
WHERE EmployeeID=1