package service

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go-invitation-system/domain"
	"go-invitation-system/repository"
)

// RSVPService handles RSVP business logic
type RSVPService struct {
	rsvpRepo       *repository.RSVPRepository
	invitationRepo *repository.InvitationRepository
	redisClient    *redis.Client
}

// NewRSVPService creates a new RSVP service
func NewRSVPService(
	rsvpRepo *repository.RSVPRepository,
	invitationRepo *repository.InvitationRepository,
	redisClient *redis.Client,
) *RSVPService {
	return &RSVPService{
		rsvpRepo:       rsvpRepo,
		invitationRepo: invitationRepo,
		redisClient:    redisClient,
	}
}

// CreateRSVP creates a new RSVP
func (s *RSVPService) CreateRSVP(req *domain.CreateRSVPRequest) (*domain.RSVPResponse, error) {
	// Validate invitation exists
	invitation, err := s.invitationRepo.GetByID(req.InvitationID)
	if err != nil {
		log.Printf("Invitation not found: %v", err)
		return nil, err
	}

	rsvp := &domain.RSVP{
		InvitationID: req.InvitationID,
		Name:         req.Name,
		Status:       req.Status,
	}

	if err := s.rsvpRepo.Create(rsvp); err != nil {
		log.Printf("Error creating RSVP: %v", err)
		return nil, err
	}

	// Invalidate cache for this invitation
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	s.redisClient.Del(ctx, "invitation:"+invitation.Slug)

	response := &domain.RSVPResponse{
		ID:           rsvp.ID,
		InvitationID: rsvp.InvitationID,
		Name:         rsvp.Name,
		Status:       rsvp.Status,
		CreatedAt:    rsvp.CreatedAt,
	}

	return response, nil
}

// GetRSVPByID retrieves an RSVP by ID
func (s *RSVPService) GetRSVPByID(id int64) (*domain.RSVP, error) {
	return s.rsvpRepo.GetByID(id)
}

// GetRSVPsByInvitationID retrieves all RSVPs for an invitation
func (s *RSVPService) GetRSVPsByInvitationID(invitationID int64) ([]domain.RSVP, error) {
	return s.rsvpRepo.GetByInvitationID(invitationID)
}

// GetRSVPStats retrieves RSVP statistics for an invitation
func (s *RSVPService) GetRSVPStats(invitationID int64) (*domain.RSVPStats, error) {
	return s.rsvpRepo.GetStatsByInvitationID(invitationID)
}

// UpdateRSVP updates an RSVP
func (s *RSVPService) UpdateRSVP(rsvp *domain.RSVP) error {
	if err := s.rsvpRepo.Update(rsvp); err != nil {
		log.Printf("Error updating RSVP: %v", err)
		return err
	}

	// Invalidate cache
	invitation, err := s.invitationRepo.GetByID(rsvp.InvitationID)
	if err == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		s.redisClient.Del(ctx, "invitation:"+invitation.Slug)
	}

	return nil
}

// DeleteRSVP deletes an RSVP
func (s *RSVPService) DeleteRSVP(id int64) error {
	rsvp, err := s.rsvpRepo.GetByID(id)
	if err != nil {
		return err
	}

	if err := s.rsvpRepo.Delete(id); err != nil {
		log.Printf("Error deleting RSVP: %v", err)
		return err
	}

	// Invalidate cache
	invitation, err := s.invitationRepo.GetByID(rsvp.InvitationID)
	if err == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		s.redisClient.Del(ctx, "invitation:"+invitation.Slug)
	}

	return nil
}
