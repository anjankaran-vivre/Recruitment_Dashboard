package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBInstance string
	DBName     string
	ServerPort string
	DBUser     string
	DBPassword string
}

func Load() *Config {
	godotenv.Load("../.env")

	cfg := &Config{
		DBHost:     getEnv("DB_HOST", ""),
		DBPort:     getEnv("DB_PORT", "1433"),
		DBInstance: getEnv("DB_SERVER", ""),
		DBName:     getEnv("DB_NAME", ""),
		ServerPort: getEnv("SERVER_PORT", ""),
		DBUser:     getEnv("DB_USER", ""),
		DBPassword: getEnv("DB_PASSWORD", ""),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}