package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/database"
)

func GetRecruiters(c *gin.Context) {
	var recruiters []RecruiterInfo
	err := database.DB.Select(&recruiters,
		`SELECT [recruiter_id], [recruiter_name], [email], [User_ID], [status]
		 FROM [dbo].[recruiters] ORDER BY [recruiter_name]`)
	if err != nil {
		log.Printf("Failed to fetch recruiters: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	if recruiters == nil {
		recruiters = []RecruiterInfo{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": recruiters})
}

func CreateRecruiter(c *gin.Context) {
	var input struct {
		RecruiterName string `json:"recruiter_name"`
		Email         string `json:"email"`
		UserID        string `json:"User_ID"`
		Status        string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	if input.Status == "" {
		input.Status = "Active"
	}

	query := `MERGE [dbo].[recruiters] AS target
		USING (SELECT @p1 AS User_ID) AS source
		ON target.[User_ID] = source.[User_ID]
		WHEN MATCHED THEN
			UPDATE SET
				[recruiter_name] = @p2,
				[email] = @p3,
				[status] = @p4,
				[UpdatedAt] = GETUTCDATE()
		WHEN NOT MATCHED THEN
			INSERT ([recruiter_name], [email], [User_ID], [status])
			VALUES (@p2, @p3, @p1, @p4)
		OUTPUT INSERTED.[recruiter_id];`

	var newID int
	err := database.DB.DB.QueryRow(query,
		input.UserID,
		input.RecruiterName,
		input.Email,
		input.Status,
	).Scan(&newID)

	if err != nil {
		log.Printf("Failed to save recruiter: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": gin.H{
			"recruiter_id":   newID,
			"recruiter_name": input.RecruiterName,
		},
	})

	fmt.Printf("Recruiter saved: %s (ID: %d)\n", input.RecruiterName, newID)
}

type RecruiterInfo struct {
	RecruiterID   int    `json:"recruiter_id" db:"recruiter_id"`
	RecruiterName string `json:"recruiter_name" db:"recruiter_name"`
	Email         string `json:"email" db:"email"`
	UserID        string `json:"User_ID" db:"User_ID"`
	Status        string `json:"status" db:"status"`
}

type ActivityRow struct {
	RecruiterName string `json:"recruiter_name" db:"Recruiter_Name"`
	TotalAssigned int    `json:"total_assigned" db:"Total_Assigned"`
	Called        int    `json:"called" db:"Called"`
	Joined        int    `json:"joined" db:"Joined"`
	Rejected      int    `json:"rejected" db:"Rejected"`
}

type ScoreRow struct {
	RecruiterName   string   `json:"recruiter_name" db:"Recruiter_Name"`
	RequisitionCount int     `json:"requisition_count" db:"Requisition_Count"`
	AvgCallAuditScore *float64 `json:"avg_call_audit_score" db:"Avg_Call_Audit_Score"`
	AvgCVScore        *float64 `json:"avg_cv_score" db:"Avg_CV_Score"`
}

type MetricsResponse struct {
	Recruiters   []RecruiterInfo `json:"recruiters"`
	Activity     []ActivityRow   `json:"activity"`
	ScoreMetrics []ScoreRow      `json:"scoreMetrics"`
}

func GetMetrics(c *gin.Context) {
	from := c.DefaultQuery("from", "1900-01-01")
	to := c.DefaultQuery("to", "2099-12-31")

	var resp MetricsResponse

	err := database.DB.Select(&resp.Recruiters,
		`SELECT [recruiter_id], [recruiter_name], [email], [User_ID], [status]
		 FROM [dbo].[recruiters] WHERE [status] = 'Active' ORDER BY [recruiter_name]`)
	if err != nil {
		log.Printf("Failed to fetch recruiters: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	err = database.DB.Select(&resp.Activity,
		`SELECT
			a.[Recruiter_Name],
			COUNT(DISTINCT a.[Id]) AS Total_Assigned,
			COUNT(DISTINCT CASE WHEN ISNULL(a.[Call_Duration], 0) > 0 THEN a.[Id] END) AS Called,
			COUNT(DISTINCT CASE WHEN LOWER(a.[Application_Status]) = 'joined' THEN a.[Id] END) AS Joined,
			COUNT(DISTINCT CASE WHEN LOWER(a.[Application_Status]) = 'rejected' THEN a.[Id] END) AS Rejected
		FROM [dbo].[application_pipeline] a
		WHERE a.[Recruiter_Name] IS NOT NULL
			AND a.[Application_Created_Time] >= @p1
			AND a.[Application_Created_Time] < DATEADD(DAY, 1, @p2)
		GROUP BY a.[Recruiter_Name]`, from, to)
	if err != nil {
		log.Printf("Failed to fetch activity: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	err = database.DB.Select(&resp.ScoreMetrics,
		`SELECT
			a.[Recruiter_Name],
			ISNULL(req_cnt.Requisition_Count, 0) AS Requisition_Count,
			AVG(CASE WHEN a.[Call_Audit_Score] IS NOT NULL THEN CAST(a.[Call_Audit_Score] AS FLOAT) END) AS Avg_Call_Audit_Score,
			AVG(CASE WHEN a.[CV_Score] IS NOT NULL THEN CAST(a.[CV_Score] AS FLOAT) END) AS Avg_CV_Score
		FROM [dbo].[application_pipeline] a
		LEFT JOIN (
			SELECT [Recruiter_Name], COUNT(*) AS Requisition_Count
			FROM [dbo].[requisition]
			GROUP BY [Recruiter_Name]
		) req_cnt ON a.[Recruiter_Name] = req_cnt.[Recruiter_Name]
		WHERE a.[Recruiter_Name] IS NOT NULL
			AND a.[Application_Created_Time] >= @p1
			AND a.[Application_Created_Time] < DATEADD(DAY, 1, @p2)
		GROUP BY a.[Recruiter_Name], req_cnt.Requisition_Count`, from, to)
	if err != nil {
		log.Printf("Failed to fetch score metrics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	if resp.Recruiters == nil {
		resp.Recruiters = []RecruiterInfo{}
	}
	if resp.Activity == nil {
		resp.Activity = []ActivityRow{}
	}
	if resp.ScoreMetrics == nil {
		resp.ScoreMetrics = []ScoreRow{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": resp})
}
