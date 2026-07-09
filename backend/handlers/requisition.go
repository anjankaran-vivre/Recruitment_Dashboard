package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/database"
	"recruitment-dashboard/backend/models"
)

func toString(v interface{}) *string {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case string:
		return &val
	case float64:
		s := strconv.FormatFloat(val, 'f', 0, 64)
		return &s
	default:
		s := fmt.Sprintf("%v", val)
		return &s
	}
}

func CreateRequisition(c *gin.Context) {
	var req models.Requisition

	log.Printf("Received request from %s", c.ClientIP())

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Bad request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"error":   err.Error(),
		})
		return
	}

	log.Printf("Processing requisition: %+v", req.RequisitionID)

	openings := parseNoOfOpenings(req.NoOfOpenings)
	requisitionID := toString(req.RequisitionID)
	jobOpeningID := toString(req.JobOpeningID)

	query := `MERGE [dbo].[requisition] AS target
		USING (SELECT @p1 AS Requisition_ID) AS source
		ON target.[Requisition_ID] = source.[Requisition_ID]
		WHEN MATCHED THEN
			UPDATE SET
				[Job_Opening_ID] = @p2,
				[Department] = @p3,
				[Job_Description] = @p4,
				[Job_Title] = @p5,
				[No_Of_Openings] = @p6,
				[Opening_Date] = @p7,
				[Recruiter_Name] = @p8,
				[Status] = @p9,
				[Target_Date] = @p10,
				[UpdatedAt] = GETUTCDATE()
		WHEN NOT MATCHED THEN
			INSERT ([Requisition_ID], [Job_Opening_ID], [Department], [Job_Description],
				[Job_Title], [No_Of_Openings], [Opening_Date], [Recruiter_Name],
				[Status], [Target_Date])
			VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10)
		OUTPUT INSERTED.[Id];`

	var newID int64
	err := database.DB.DB.QueryRow(query,
		requisitionID,
		jobOpeningID,
		req.Department,
		req.JobDescription,
		req.JobTitle,
		openings,
		req.OpeningDate,
		req.RecruiterName,
		req.Status,
		req.TargetDate,
	).Scan(&newID)

	if err != nil {
		log.Printf("Failed to save requisition: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to save requisition",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Requisition saved successfully",
		"data": gin.H{
			"id":              newID,
			"Requisition_ID":  requisitionID,
			"Job_Opening_ID":  jobOpeningID,
		},
	})

	fmt.Printf("Requisition saved with ID: %d (Requisition_ID: %v)\n", newID, req.RequisitionID)
}

func GetRequisitions(c *gin.Context) {
	query := `SELECT [Id], [Job_Opening_ID], [Requisition_ID], [Department], [Job_Description],
		[Job_Title], [No_Of_Openings], [Opening_Date], [Recruiter_Name],
		[Status], [Target_Date], [CreatedAt], [UpdatedAt]
		FROM [dbo].[requisition] ORDER BY [CreatedAt] DESC`

	var requisitions []models.Requisition
	err := database.DB.Select(&requisitions, query)
	if err != nil {
		log.Printf("Failed to fetch requisitions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch requisitions",
			"error":   err.Error(),
		})
		return
	}

	if requisitions == nil {
		requisitions = []models.Requisition{}
	}

	for i := range requisitions {
		requisitions[i].JobOpeningID = toString(requisitions[i].JobOpeningID)
		requisitions[i].RequisitionID = toString(requisitions[i].RequisitionID)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    requisitions,
	})
}

func parseNoOfOpenings(v interface{}) *int {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case float64:
		n := int(val)
		return &n
	case string:
		if val == "" {
			return nil
		}
		n, err := strconv.Atoi(val)
		if err != nil {
			return nil
		}
		return &n
	default:
		return nil
	}
}
