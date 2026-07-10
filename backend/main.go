package main

import (
	"fmt"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"recruitment-dashboard/backend/config"
	"recruitment-dashboard/backend/database"
	"recruitment-dashboard/backend/handlers"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	defer database.Close()

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	router.SetTrustedProxies(nil)

	api := router.Group("/api")
	{
		api.GET("/requisitions", handlers.GetRequisitions)
		api.POST("/requisition", handlers.CreateRequisition)
		api.GET("/applications", handlers.GetApplications)
		api.POST("/application", handlers.CreateApplication)
		api.GET("/summary", handlers.GetSummary)
		api.POST("/call", handlers.CreateCall)
		api.POST("/calls", handlers.CreateCall)
		api.GET("/calls", handlers.GetCalls)
		api.GET("/metrics", handlers.GetMetrics)
		api.GET("/recruiters", handlers.GetRecruiters)
		api.POST("/recruiter", handlers.CreateRecruiter)
	}

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	fmt.Printf("Server starting on %s\n", addr)
	router.Run(addr)
}
