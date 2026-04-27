package repository

import (
	"database/sql"
	"errors"
	"log"
	"time"

	"go-invitation-system/domain"
)

// InvitationRepository handles invitation database operations
type InvitationRepository struct {
	db *sql.DB
}

// NewInvitationRepository creates a new invitation repository
func NewInvitationRepository(db *sql.DB) *InvitationRepository {
	return &InvitationRepository{db: db}
}

// Create creates a new invitation
func (r *InvitationRepository) Create(invitation *domain.Invitation) error {
	query := `
		INSERT INTO invitations (title, slug, image_url_1, image_url_2, image_url_3, event_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`

	now := time.Now()
	err := r.db.QueryRow(
		query,
		invitation.Title,
		invitation.Slug,
		invitation.ImageURL1,
		invitation.ImageURL2,
		invitation.ImageURL3,
		invitation.EventDate,
		now,
		now,
	).Scan(&invitation.ID, &invitation.CreatedAt, &invitation.UpdatedAt)

	if err != nil {
		log.Printf("Error creating invitation: %v", err)
		return err
	}

	return nil
}

// GetByID retrieves an invitation by ID
func (r *InvitationRepository) GetByID(id int64) (*domain.Invitation, error) {
	query := `
		SELECT id, title, slug, image_url_1, image_url_2, image_url_3, event_date, created_at, updated_at
		FROM invitations
		WHERE id = $1
	`

	invitation := &domain.Invitation{}
	err := r.db.QueryRow(query, id).Scan(
		&invitation.ID,
		&invitation.Title,
		&invitation.Slug,
		&invitation.ImageURL1,
		&invitation.ImageURL2,
		&invitation.ImageURL3,
		&invitation.EventDate,
		&invitation.CreatedAt,
		&invitation.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invitation not found")
		}
		log.Printf("Error retrieving invitation: %v", err)
		return nil, err
	}

	return invitation, nil
}

// GetBySlug retrieves an invitation by slug
func (r *InvitationRepository) GetBySlug(slug string) (*domain.Invitation, error) {
	query := `
		SELECT id, title, slug, image_url_1, image_url_2, image_url_3, event_date, created_at, updated_at
		FROM invitations
		WHERE slug = $1
	`

	invitation := &domain.Invitation{}
	err := r.db.QueryRow(query, slug).Scan(
		&invitation.ID,
		&invitation.Title,
		&invitation.Slug,
		&invitation.ImageURL1,
		&invitation.ImageURL2,
		&invitation.ImageURL3,
		&invitation.EventDate,
		&invitation.CreatedAt,
		&invitation.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invitation not found")
		}
		log.Printf("Error retrieving invitation: %v", err)
		return nil, err
	}

	return invitation, nil
}

// GetAll retrieves all invitations
func (r *InvitationRepository) GetAll() ([]domain.Invitation, error) {
	query := `
		SELECT id, title, slug, image_url_1, image_url_2, image_url_3, event_date, created_at, updated_at
		FROM invitations
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		log.Printf("Error retrieving invitations: %v", err)
		return nil, err
	}
	defer rows.Close()

	invitations := make([]domain.Invitation, 0)
	for rows.Next() {
		invitation := domain.Invitation{}
		err := rows.Scan(
			&invitation.ID,
			&invitation.Title,
			&invitation.Slug,
			&invitation.ImageURL1,
			&invitation.ImageURL2,
			&invitation.ImageURL3,
			&invitation.EventDate,
			&invitation.CreatedAt,
			&invitation.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning invitation: %v", err)
			continue
		}
		invitations = append(invitations, invitation)
	}

	return invitations, nil
}

// Update updates an invitation
func (r *InvitationRepository) Update(invitation *domain.Invitation) error {
	query := `
		UPDATE invitations
		SET title = $1, slug = $2, image_url_1 = $3, image_url_2 = $4, image_url_3 = $5, event_date = $6, updated_at = $7
		WHERE id = $8
	`

	now := time.Now()
	result, err := r.db.Exec(
		query,
		invitation.Title,
		invitation.Slug,
		invitation.ImageURL1,
		invitation.ImageURL2,
		invitation.ImageURL3,
		invitation.EventDate,
		now,
		invitation.ID,
	)

	if err != nil {
		log.Printf("Error updating invitation: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("invitation not found")
	}

	return nil
}

// Delete deletes an invitation
func (r *InvitationRepository) Delete(id int64) error {
	query := `DELETE FROM invitations WHERE id = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		log.Printf("Error deleting invitation: %v", err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("invitation not found")
	}

	return nil
}
