package database

import (
	"fmt"

	"recruitment-dashboard/backend/config"
)

func DBConnectionString(cfg *config.Config) string {
	return fmt.Sprintf("server=%s,%s;user id=%s;password=%s;database=%s;trustservercertificate=true",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)
}

