package database

import (
	"fmt"

	"recruitment-dashboard/backend/config"
)

func DBConnectionString(cfg *config.Config) string {
	return fmt.Sprintf(
		"sqlserver://@%s?instance=%s&database=%s&trusted_connection=yes&TrustServerCertificate=true",
		cfg.DBHost,
		cfg.DBInstance,
		cfg.DBName,
	)
}