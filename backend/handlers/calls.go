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

func CreateCall(c *gin.Context) {
	var input struct {
		CallID        string `json:"Call_ID"`
		CallStartTime string `json:"Call_Start_Time"`
		CallType      string `json:"Call_Type"`
		Email         string `json:"Email"`
		CallOwner     string `json:"Call_Owner"`
		CallDuration  string `json:"Call_Duration"`
		Mobile        string `json:"Mobile"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request payload",
			"error":   err.Error(),
		})
		return
	}

	query := `MERGE [dbo].[recruiter_calls] AS target
		USING (SELECT @p1 AS Call_ID) AS source
		ON target.[Call_ID] = source.[Call_ID]
		WHEN MATCHED THEN
			UPDATE SET
				[Call_Start_Time] = @p2,
				[Call_Type] = @p3,
				[Call_Owner_Email] = @p4,
				[Call_Owner] = @p5,
				[Call_Duration] = @p6,
				[Mobile] = @p7,
				[UpdatedAt] = GETUTCDATE()
		WHEN NOT MATCHED THEN
			INSERT ([Call_ID], [Call_Start_Time], [Call_Type], [Call_Owner_Email],
				[Call_Owner], [Call_Duration], [Mobile])
			VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7)
		OUTPUT INSERTED.[Id];`

	var newID int64
	err := database.DB.DB.QueryRow(query,
		input.CallID,
		input.CallStartTime,
		input.CallType,
		input.Email,
		input.CallOwner,
		input.CallDuration,
		input.Mobile,
	).Scan(&newID)

	if err != nil {
		log.Printf("Failed to save call: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to save call",
			"error":   err.Error(),
		})
		return
	}

	if input.Mobile != "" {
		dur, _ := strconv.ParseFloat(input.CallDuration, 64)
		if dur > 0 {
			_, err := database.DB.DB.Exec(`
				UPDATE [dbo].[application_pipeline]
				SET [Call_Duration] = ISNULL([Call_Duration], 0) + @p1,
				    [UpdatedAt] = GETUTCDATE()
				WHERE [Mobile] = @p2
			`, dur, input.Mobile)
			if err != nil {
				log.Printf("Failed to update application Call_Duration for mobile %s: %v", input.Mobile, err)
			}
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Call saved successfully",
		"data": gin.H{
			"id":      newID,
			"Call_ID": input.CallID,
		},
	})

	fmt.Printf("Call saved with ID: %d (Call_ID: %s)\n", newID, input.CallID)
}

func SyncCallDurations(c *gin.Context) {
	query := `
		UPDATE [dbo].[application_pipeline]
		SET [Call_Duration] = (
			SELECT ISNULL(SUM(CAST(ISNULL([Call_Duration], '0') AS DECIMAL(10,2))), 0)
			FROM [dbo].[recruiter_calls]
			WHERE [Mobile] = [dbo].[application_pipeline].[Mobile]
		),
		[UpdatedAt] = GETUTCDATE()
		WHERE [Mobile] IS NOT NULL AND [Mobile] != ''`

	result, err := database.DB.DB.Exec(query)
	if err != nil {
		log.Printf("Failed to sync call durations: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to sync call durations",
			"error":   err.Error(),
		})
		return
	}

	rows, _ := result.RowsAffected()
	log.Printf("Synced Call_Duration for %d applications", rows)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Synced Call_Duration for %d applications", rows),
	})
}

func GetCalls(c *gin.Context) {
	query := `SELECT [Id], [Call_ID], [Call_Start_Time], [Call_Type],
		[Call_Owner_Email], [Call_Owner], [Call_Duration], [Mobile], [CreatedAt]
		FROM [dbo].[recruiter_calls] ORDER BY [CreatedAt] DESC`

	var calls []models.RecruiterCall
	err := database.DB.Select(&calls, query)
	if err != nil {
		log.Printf("Failed to fetch calls: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch calls",
			"error":   err.Error(),
		})
		return
	}

	if calls == nil {
		calls = []models.RecruiterCall{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    calls,
	})
}
