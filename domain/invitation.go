package domain

import "time"

// Invitation represents a digital invitation
type Invitation struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	ImageURL1 string    `json:"image_url_1"`
	ImageURL2 string    `json:"image_url_2"`
	ImageURL3 string    `json:"image_url_3"`
	EventDate time.Time `json:"event_date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CreateInvitationRequest represents the request to create an invitation
type CreateInvitationRequest struct {
	Title     string    `json:"title" validate:"required"`
	Slug      string    `json:"slug" validate:"required,lowercase,alphanum"`
	ImageURL1 string    `json:"image_url_1"`
	ImageURL2 string    `json:"image_url_2"`
	ImageURL3 string    `json:"image_url_3"`
	EventDate time.Time `json:"event_date" validate:"required"`
}

// GetInvitationResponse represents the response when getting an invitation
type GetInvitationResponse struct {
	ID           int64     `json:"id"`
	Title        string    `json:"title"`
	Slug         string    `json:"slug"`
	ImageURL1    string    `json:"image_url_1"`
	ImageURL2    string    `json:"image_url_2"`
	ImageURL3    string    `json:"image_url_3"`
	EventDate    time.Time `json:"event_date"`
	CreatedAt    time.Time `json:"created_at"`
	RSVPCount    int       `json:"rsvp_count"`
	VisitorCount int       `json:"visitor_count"`
}
