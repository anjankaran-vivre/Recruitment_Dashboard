package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBInstance string
	DBName     string
	ServerPort string
}

func Load() *Config {
	godotenv.Load()

	cfg := &Config{
		DBHost:     getEnv("DB_HOST", ""),
		DBInstance: getEnv("DB_SERVER", ""),
		DBName:     getEnv("DB_NAME", ""),
		ServerPort: getEnv("SERVER_PORT", ""),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}