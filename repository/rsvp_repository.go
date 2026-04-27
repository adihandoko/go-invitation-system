package repository

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"go-invitation-system/domain"
)

// RSVPRepository handles RSVP database operations
type RSVPRepository struct {
	db *sql.DB
}

// NewRSVPRepository creates a new RSVP repository
func NewRSVPRepository(db *sql.DB) *RSVPRepository {
	return &RSVPRepository{db: db}
}

// Create creates a new RSVP
func (r *RSVPRepository) Create(rsvp *domain.RSVP) error {
	query := `
		INSERT INTO rsvps (invitation_id, name, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	now := time.Now()
	err := r.db.QueryRow(
		query,
		rsvp.InvitationID,
		rsvp.Name,
		rsvp.Status,
		now,
		now,
	).Scan(&rsvp.ID, &rsvp.CreatedAt, &rsvp.UpdatedAt)

	if err != nil {
		log.Printf("Error creating RSVP: %v", err)
		return err
	}

	return nil
}

// GetByID retrieves an RSVP by ID
func (r *RSVPRepository) GetByID(id int64) (*domain.RSVP, error) {
	query := `
		SELECT id, invitation_id, name, status, created_at, updated_at
		FROM rsvps
		WHERE id = $1
	`

	rsvp := &domain.RSVP{}
	err := r.db.QueryRow(query, id).Scan(
		&rsvp.ID,
		&rsvp.InvitationID,
		&rsvp.Name,
		&rsvp.Status,
		&rsvp.CreatedAt,
		&rsvp.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("rsvp not found")
		}
		log.Printf("Error retrieving RSVP: %v", err)
		return nil, err
	}

	return rsvp, nil
}

// GetByInvitationID retrieves all RSVPs for an invitation
func (r *RSVPRepository) GetByInvitationID(invitationID int64) ([]domain.RSVP, error) {
	query := `
		SELECT id, invitation_id, name, status, created_at, updated_at
		FROM rsvps
		WHERE invitation_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, invitationID)
	if err != nil {
		log.Printf("Error retrieving RSVPs: %v", err)
		return nil, err
	}
	defer rows.Close()

	rsvps := make([]domain.RSVP, 0)
	for rows.Next() {
		rsvp := domain.RSVP{}
		err := rows.Scan(
			&rsvp.ID,
			&rsvp.InvitationID,
			&rsvp.Name,
			&rsvp.Status,
			&rsvp.CreatedAt,
			&rsvp.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning RSVP: %v", err)
			continue
		}
		rsvps = append(rsvps, rsvp)
	}

	return rsvps, nil
}

// GetStatsByInvitationID gets RSVP statistics for an invitation
func (r *RSVPRepository) GetStatsByInvitationID(invitationID int64) (*domain.RSVPStats, error) {
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN status = 'attending' THEN 1 ELSE 0 END), 0) as attending,
			COALESCE(SUM(CASE WHEN status = 'not_attending' THEN 1 ELSE 0 END), 0) as not_attending,
			COALESCE(SUM(CASE WHEN status = 'maybe' THEN 1 ELSE 0 END), 0) as maybe,
			COUNT(*) as total
		FROM rsvps
		WHERE invitation_id = $1
	`

	stats := &domain.RSVPStats{}
	err := r.db.QueryRow(query, invitationID).Scan(
		&stats.Attending,
		&stats.NotAttending,
		&stats.Maybe,
		&stats.Total,
	)

	if err != nil {
		log.Printf("Error retrieving RSVP stats: %v", err)
		return nil, err
	}

	return stats, nil
}

// Update updates an RSVP
func (r *RSVPRepository) Update(rsvp *domain.RSVP) error {
	query := `
		UPDATE rsvps
		SET name = $1, status = $2, updated_at = $3
		WHERE id = $4
	`

	now := time.Now()
	result, err := r.db.Exec(
		query,
		rsvp.Name,
		rsvp.Status,
		now,
		rsvp.ID,
	)

	if err != nil {
		log.Printf("Error updating RSVP: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("rsvp not found")
	}

	return nil
}

// Delete deletes an RSVP
func (r *RSVPRepository) Delete(id int64) error {
	query := `DELETE FROM rsvps WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		log.Printf("Error deleting RSVP: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("rsvp not found")
	}

	return nil
}
