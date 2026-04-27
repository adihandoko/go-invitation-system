package repository

import (
	"database/sql"
	"log"
	"time"

	"go-invitation-system/domain"
)

// VisitorRepository handles visitor database operations
type VisitorRepository struct {
	db *sql.DB
}

// NewVisitorRepository creates a new visitor repository
func NewVisitorRepository(db *sql.DB) *VisitorRepository {
	return &VisitorRepository{db: db}
}

// Create creates a new visitor record
func (r *VisitorRepository) Create(visitor *domain.Visitor) error {
	query := `
		INSERT INTO visitors (invitation_id, created_at)
		VALUES ($1, $2)
		RETURNING id, created_at
	`

	now := time.Now()
	err := r.db.QueryRow(
		query,
		visitor.InvitationID,
		now,
	).Scan(&visitor.ID, &visitor.CreatedAt)

	if err != nil {
		log.Printf("Error creating visitor: %v", err)
		return err
	}

	return nil
}

// GetCountByInvitationID gets the visitor count for an invitation
func (r *VisitorRepository) GetCountByInvitationID(invitationID int64) (int, error) {
	query := `
		SELECT COUNT(*) FROM visitors WHERE invitation_id = $1
	`

	count := 0
	err := r.db.QueryRow(query, invitationID).Scan(&count)
	if err != nil {
		log.Printf("Error retrieving visitor count: %v", err)
		return 0, err
	}

	return count, nil
}
