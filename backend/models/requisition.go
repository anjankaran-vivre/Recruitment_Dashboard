package models

import "time"

type Requisition struct {
	ID            *int64    `json:"id" db:"Id"`
	JobOpeningID  interface{} `json:"Job_Opening_ID" db:"Job_Opening_ID"`
	RequisitionID interface{} `json:"Requisition_ID" db:"Requisition_ID"`
	Department    *string   `json:"Department" db:"Department"`
	JobDescription *string  `json:"Job_Description" db:"Job_Description"`
	JobTitle      *string   `json:"Job_Title" db:"Job_Title"`
	NoOfOpenings  interface{} `json:"No_Of_Openings" db:"No_Of_Openings"`
	OpeningDate   *string   `json:"Opening_Date" db:"Opening_Date"`
	RecruiterName *string   `json:"Recruiter_Name" db:"Recruiter_Name"`
	Status        *string   `json:"Status" db:"Status"`
	TargetDate    *string   `json:"Target_Date" db:"Target_Date"`
	CreatedAt     time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt     time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
