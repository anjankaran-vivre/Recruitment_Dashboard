package models

import "time"

type Application struct {
	ID                   *int64   `json:"id" db:"Id"`
	ApplicationID        *string  `json:"Application_ID" db:"Application_ID"`
	ApplicationCreatedTime *string `json:"Application_Created_Time" db:"Application_Created_Time"`
	ApplicationStatus    *string  `json:"Application_Status" db:"Application_Status"`
	CallAuditScore       *string `json:"Call_Audit_Score" db:"Call_Audit_Score"`
	CallPriority         *string `json:"Call_Priority" db:"Call_Priority"`
	CandidateName        *string `json:"Candidate_Name" db:"Candidate_Name"`
	CVLink               *string `json:"CV_Link" db:"CV_Link"`
	CVScore              *string `json:"CV_Score" db:"CV_Score"`
	JobOpeningID         interface{} `json:"Job_Opening_ID" db:"Job_Opening_ID"`
	Mobile               *string  `json:"Mobile" db:"Mobile"`
	PostingTitle         *string  `json:"Posting_Title" db:"Posting_Title"`
	RecruiterName        *string  `json:"Recruiter_Name" db:"Recruiter_Name"`
	Source               *string  `json:"Source" db:"Source"`
	ProfileSummary       *string  `json:"Profile_Summary" db:"Profile_Summary"`
	TellecallingFeedback *string  `json:"Tellecalling_Feedback" db:"Tellecalling_Feedback"`
	CreatedAt            time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt            time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
