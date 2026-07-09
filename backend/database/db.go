package database

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/microsoft/go-mssqldb"
	_ "github.com/microsoft/go-mssqldb/sharedmemory"

	"recruitment-dashboard/backend/config"
)

var DB *sqlx.DB

func Connect(cfg *config.Config) {
	var err error
	connStr := DBConnectionString(cfg)
	DB, err = sqlx.Connect("sqlserver", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB.SetMaxOpenConns(20)
	DB.SetMaxIdleConns(10)
	DB.SetConnMaxLifetime(3600)
	DB.SetConnMaxIdleTime(600)

	if err = DB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	RunMigrations()

	fmt.Println("Connected to SQL Server database successfully")
}

func RunMigrations() {
	query := `
		IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[application_pipeline]') AND type in (N'U'))
		BEGIN
			CREATE TABLE [dbo].[application_pipeline] (
				[Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
				[Application_ID] NVARCHAR(255) NULL,
				[Application_Created_Time] DATETIME2 NULL,
				[Application_Status] NVARCHAR(100) NULL,
				[Call_Audit_Score] DECIMAL(5,2) NULL,
				[Call_Priority] NVARCHAR(50) NULL,
				[Candidate_Name] NVARCHAR(255) NULL,
				[CV_Link] NVARCHAR(500) NULL,
				[CV_Score] DECIMAL(5,2) NULL,
				[Job_Opening_ID] NVARCHAR(255) NULL,
				[Mobile] NVARCHAR(50) NULL,
				[Posting_Title] NVARCHAR(500) NULL,
				[Recruiter_Name] NVARCHAR(255) NULL,
				[Source] NVARCHAR(255) NULL,
				[Profile_Summary] NVARCHAR(MAX) NULL,
				[Tellecalling_Feedback] NVARCHAR(MAX) NULL,
				[CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				CONSTRAINT [UQ_application_pipeline_ApplicationID] UNIQUE ([Application_ID])
			)
		END
	`
	_, err := DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	alterQuery := `
		IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[application_pipeline]') AND name = 'Job_Opening_ID')
		BEGIN
			ALTER TABLE [dbo].[application_pipeline] ADD [Job_Opening_ID] NVARCHAR(255) NULL
		END
	`
	_, err = DB.Exec(alterQuery)
	if err != nil {
		log.Fatalf("Failed to alter application_pipeline table: %v", err)
	}

	query = `
		IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[requisition]') AND type in (N'U'))
		BEGIN
			CREATE TABLE [dbo].[requisition] (
				[Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
				[Job_Opening_ID] NVARCHAR(255) NULL,
				[Requisition_ID] NVARCHAR(255) NULL,
				[Department] NVARCHAR(255) NULL,
				[Job_Description] NVARCHAR(MAX) NULL,
				[Job_Title] NVARCHAR(500) NULL,
				[No_Of_Openings] INT NULL,
				[Opening_Date] DATETIME2 NULL,
				[Recruiter_Name] NVARCHAR(255) NULL,
				[Status] NVARCHAR(100) NULL,
				[Target_Date] DATETIME2 NULL,
				[CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				[UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
				CONSTRAINT [UQ_requisition_JobOpeningID] UNIQUE ([Job_Opening_ID]),
				CONSTRAINT [UQ_requisition_RequisitionID] UNIQUE ([Requisition_ID])
			)
		END
	`
	_, err = DB.Exec(query)
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	fmt.Println("Migrations completed successfully")
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}
