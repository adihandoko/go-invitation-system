package domain

import "time"

// RSVP represents a guest RSVP
type RSVP struct {
	ID            int64     `json:"id"`
	InvitationID  int64     `json:"invitation_id"`
	Name          string    `json:"name"`
	Status        string    `json:"status"` // attending, not_attending, maybe
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// CreateRSVPRequest represents the request to create an RSVP
type CreateRSVPRequest struct {
	InvitationID int64  `json:"invitation_id" validate:"required"`
	Name         string `json:"name" validate:"required,max=255"`
	Status       string `json:"status" validate:"required,oneof=attending not_attending maybe"`
}

// RSVPResponse represents the response after creating an RSVP
type RSVPResponse struct {
	ID           int64     `json:"id"`
	InvitationID int64     `json:"invitation_id"`
	Name         string    `json:"name"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

// RSVPStats represents RSVP statistics
type RSVPStats struct {
	Attending     int `json:"attending"`
	NotAttending  int `json:"not_attending"`
	Maybe         int `json:"maybe"`
	Total         int `json:"total"`
}
