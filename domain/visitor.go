package domain

import "time"

// Visitor represents a visitor to an invitation
type Visitor struct {
	ID             int64     `json:"id"`
	InvitationID   int64     `json:"invitation_id"`
	CreatedAt      time.Time `json:"created_at"`
}

// VisitorStats represents visitor statistics
type VisitorStats struct {
	InvitationID int64 `json:"invitation_id"`
	Count        int   `json:"count"`
}
