package models

import "time"

type Recruiter struct {
	RecruiterID     int       `json:"recruiter_id" db:"recruiter_id"`
	RecruiterName   string    `json:"recruiter_name" db:"recruiter_name"`
	Email           string    `json:"email" db:"email"`
	UserID          string    `json:"User_ID" db:"User_ID"`
	Status          string    `json:"status" db:"status"`
	CreatedAt       time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt       time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
