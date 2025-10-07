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