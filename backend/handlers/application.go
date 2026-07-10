package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/database"
	"recruitment-dashboard/backend/models"
)

func CreateApplication(c *gin.Context) {
	var app models.Application

	log.Printf("Received request from %s", c.ClientIP())

	if err := c.ShouldBindJSON(&app); err != nil {
		log.Printf("Bad request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("Processing application: %+v", app.ApplicationID)

	query := `MERGE [dbo].[application_pipeline] AS target
		USING (SELECT @p1 AS Application_ID) AS source
		ON target.[Application_ID] = source.[Application_ID]
		WHEN MATCHED THEN
			UPDATE SET
				[Application_Created_Time] = @p2,
				[Application_Status] = @p3,
				[Call_Audit_Score] = @p4,
				[Call_Priority] = @p5,
				[Candidate_Name] = @p6,
				[CV_Link] = @p7,
				[CV_Score] = @p8,
				[Job_Opening_ID] = @p9,
				[Mobile] = @p10,
				[Posting_Title] = @p11,
				[Recruiter_Name] = @p12,
				[Source] = @p13,
				[Profile_Summary] = @p14,
				[Tellecalling_Feedback] = @p15,
				[TelleCalling_Time] = @p16,
				[Tellecalling_Status] = @p17,
				[Telecalling_Completed_DateTIme] = @p18,
				[Manager_Interview_DateTime] = @p19,
				[Manager_Round_Schedule_DateTime] = @p20,
				[Manager_Round_Completed_Time] = @p21,
				[UpdatedAt] = GETUTCDATE()
		WHEN NOT MATCHED THEN
			INSERT ([Application_ID], [Application_Created_Time], [Application_Status],
				[Call_Audit_Score], [Call_Priority], [Candidate_Name], [CV_Link],
				[CV_Score], [Job_Opening_ID], [Mobile], [Posting_Title], [Recruiter_Name],
				[Source], [Profile_Summary], [Tellecalling_Feedback],
				[TelleCalling_Time], [Tellecalling_Status], [Telecalling_Completed_DateTIme],
				[Manager_Interview_DateTime], [Manager_Round_Schedule_DateTime], [Manager_Round_Completed_Time])
			VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15,
				@p16, @p17, @p18, @p19, @p20, @p21)
		OUTPUT INSERTED.[Id];`

	auditScore := parseFloat(app.CallAuditScore)
	cvScore := parseFloat(app.CVScore)
	cvLink := extractHref(app.CVLink)
	jobOpeningID := toString(app.JobOpeningID)

	var newID int64
	err := database.DB.DB.QueryRow(query,
		app.ApplicationID,
		app.ApplicationCreatedTime,
		app.ApplicationStatus,
		auditScore,
		app.CallPriority,
		app.CandidateName,
		cvLink,
		cvScore,
		jobOpeningID,
		app.Mobile,
		app.PostingTitle,
		app.RecruiterName,
		app.Source,
		app.ProfileSummary,
		app.TellecallingFeedback,
		app.TelleCallingTime,
		app.TellecallingStatus,
		app.TelecallingCompletedDateTime,
		app.ManagerInterviewDateTime,
		app.ManagerRoundScheduleDateTime,
		app.ManagerRoundCompletedTime,
	).Scan(&newID)

	if err != nil {
		log.Printf("Failed to save application: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to save application",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Application saved successfully",
		"data": gin.H{
			"id":             newID,
			"Application_ID": app.ApplicationID,
		},
	})

	fmt.Printf("Application saved with ID: %d (Application_ID: %v)\n", newID, app.ApplicationID)
}

func GetApplications(c *gin.Context) {
	query := `SELECT [Id], [Application_ID], [Application_Created_Time], [Application_Status],
		[Call_Audit_Score], [Call_Priority], [Candidate_Name], [CV_Link],
		[CV_Score], [Job_Opening_ID], [Mobile], [Posting_Title], [Recruiter_Name],
		[Source], [Profile_Summary], [Tellecalling_Feedback],
		[TelleCalling_Time], [Tellecalling_Status], [Telecalling_Completed_DateTIme],
		[Manager_Interview_DateTime], [Manager_Round_Schedule_DateTime], [Manager_Round_Completed_Time],
		[Call_Duration], [CreatedAt], [UpdatedAt]
		FROM [dbo].[application_pipeline] ORDER BY [Application_Created_Time] DESC`

	var applications []models.Application
	err := database.DB.Select(&applications, query)
	if err != nil {
		log.Printf("Failed to fetch applications: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch applications",
			"error":   err.Error(),
		})
		return
	}

	if applications == nil {
		applications = []models.Application{}
	}

	for i := range applications {
		applications[i].CVLink = extractHref(applications[i].CVLink)
		applications[i].JobOpeningID = toString(applications[i].JobOpeningID)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    applications,
	})
}

func GetSummary(c *gin.Context) {
	type Summary struct {
		TotalRequisitions    int `json:"total_requisitions"`
		OpenRequisitions     int `json:"open_requisitions"`
		TotalApplications    int `json:"total_applications"`
		TotalCandidates      int `json:"total_candidates"`
		AvgCVScore           float64 `json:"avg_cv_score"`
		AvgCallAuditScore    float64 `json:"avg_call_audit_score"`
	}

	var summary Summary

	err := database.DB.Get(&summary.TotalRequisitions,
		`SELECT COUNT(*) FROM [dbo].[requisition]`)
	if err != nil {
		log.Printf("Failed to count requisitions: %v", err)
	}

	err = database.DB.Get(&summary.OpenRequisitions,
		`SELECT COUNT(*) FROM [dbo].[requisition] WHERE [Status] = 'Open' OR [Status] IS NULL`)
	if err != nil {
		log.Printf("Failed to count open requisitions: %v", err)
	}

	err = database.DB.Get(&summary.TotalApplications,
		`SELECT COUNT(*) FROM [dbo].[application_pipeline]`)
	if err != nil {
		log.Printf("Failed to count applications: %v", err)
	}

	err = database.DB.Get(&summary.TotalCandidates,
		`SELECT COUNT(DISTINCT [Candidate_Name]) FROM [dbo].[application_pipeline]`)
	if err != nil {
		log.Printf("Failed to count candidates: %v", err)
	}

	err = database.DB.Get(&summary.AvgCVScore,
		`SELECT ISNULL(AVG(CAST([CV_Score] AS FLOAT)), 0) FROM [dbo].[application_pipeline]`)
	if err != nil {
		log.Printf("Failed to avg CV score: %v", err)
	}

	err = database.DB.Get(&summary.AvgCallAuditScore,
		`SELECT ISNULL(AVG(CAST([Call_Audit_Score] AS FLOAT)), 0) FROM [dbo].[application_pipeline]`)
	if err != nil {
		log.Printf("Failed to avg call audit score: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

func extractHref(s *string) *string {
	if s == nil || *s == "" {
		return s
	}
	idx := strings.Index(*s, `href=`)
	if idx == -1 {
		return s
	}
	after := (*s)[idx+5:]
	quoteIdx := strings.IndexAny(after, `"'`)
	if quoteIdx == -1 {
		return s
	}
	quote := after[quoteIdx]
	start := idx + 5 + quoteIdx + 1
	end := strings.Index((*s)[start:], string(quote))
	if end == -1 {
		return s
	}
	url := (*s)[start : start+end]
	return &url
}

func parseFloat(s *string) *float64 {
	if s == nil || *s == "" {
		return nil
	}
	v, err := strconv.ParseFloat(*s, 64)
	if err != nil {
		return nil
	}
	return &v
}
