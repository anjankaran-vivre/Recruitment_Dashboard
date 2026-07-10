package models

import "time"

type RecruiterCall struct {
	ID             int64     `json:"id" db:"Id"`
	CallID         string    `json:"Call_ID" db:"Call_ID"`
	CallStartTime  *string   `json:"Call_Start_Time" db:"Call_Start_Time"`
	CallType       *string   `json:"Call_Type" db:"Call_Type"`
	CallOwnerEmail *string   `json:"Call_Owner_Email" db:"Call_Owner_Email"`
	CallOwner      *string   `json:"Call_Owner" db:"Call_Owner"`
	CallDuration   *string   `json:"Call_Duration" db:"Call_Duration"`
	Mobile         *string   `json:"Mobile" db:"Mobile"`
	CreatedAt      time.Time `json:"CreatedAt" db:"CreatedAt"`
	UpdatedAt      time.Time `json:"UpdatedAt" db:"UpdatedAt"`
}
