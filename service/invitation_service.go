package service

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"go-invitation-system/domain"
	"go-invitation-system/repository"
)

// InvitationService handles invitation business logic
type InvitationService struct {
	invitationRepo *repository.InvitationRepository
	rsvpRepo       *repository.RSVPRepository
	visitorRepo    *repository.VisitorRepository
	redisClient    *redis.Client
	cacheTTL       time.Duration
}

// NewInvitationService creates a new invitation service
func NewInvitationService(
	invitationRepo *repository.InvitationRepository,
	rsvpRepo *repository.RSVPRepository,
	visitorRepo *repository.VisitorRepository,
	redisClient *redis.Client,
) *InvitationService {
	return &InvitationService{
		invitationRepo: invitationRepo,
		rsvpRepo:       rsvpRepo,
		visitorRepo:    visitorRepo,
		redisClient:    redisClient,
		cacheTTL:       60 * time.Second,
	}
}

// CreateInvitation creates a new invitation
func (s *InvitationService) CreateInvitation(req *domain.CreateInvitationRequest) (*domain.Invitation, error) {
	invitation := &domain.Invitation{
		Title:     req.Title,
		Slug:      req.Slug,
		ImageURL1: req.ImageURL1,
		ImageURL2: req.ImageURL2,
		ImageURL3: req.ImageURL3,
		EventDate: req.EventDate,
	}

	if err := s.invitationRepo.Create(invitation); err != nil {
		log.Printf("Error creating invitation: %v", err)
		return nil, err
	}

	return invitation, nil
}

// GetInvitationBySlug retrieves an invitation by slug with caching
func (s *InvitationService) GetInvitationBySlug(slug string) (*domain.GetInvitationResponse, error) {
	cacheKey := "invitation:" + slug

	// Try to get from cache
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cachedData, err := s.redisClient.Get(ctx, cacheKey).Result()
	if err == nil {
		// Found in cache
		var response domain.GetInvitationResponse
		if err := json.Unmarshal([]byte(cachedData), &response); err == nil {
			log.Printf("Cache hit for invitation: %s", slug)
			return &response, nil
		}
	}

	// Not in cache, get from database
	invitation, err := s.invitationRepo.GetBySlug(slug)
	if err != nil {
		log.Printf("Error getting invitation: %v", err)
		return nil, err
	}

	// Get RSVP count
	rsvpStats, err := s.rsvpRepo.GetStatsByInvitationID(invitation.ID)
	if err != nil {
		log.Printf("Error getting RSVP stats: %v", err)
		return nil, err
	}

	// Get visitor count
	visitorCount, err := s.visitorRepo.GetCountByInvitationID(invitation.ID)
	if err != nil {
		log.Printf("Error getting visitor count: %v", err)
		return nil, err
	}

	response := &domain.GetInvitationResponse{
		ID:           invitation.ID,
		Title:        invitation.Title,
		Slug:         invitation.Slug,
		ImageURL1:    invitation.ImageURL1,
		ImageURL2:    invitation.ImageURL2,
		ImageURL3:    invitation.ImageURL3,
		EventDate:    invitation.EventDate,
		CreatedAt:    invitation.CreatedAt,
		RSVPCount:    rsvpStats.Total,
		VisitorCount: visitorCount,
	}

	// Cache the response
	if data, err := json.Marshal(response); err == nil {
		s.redisClient.Set(ctx, cacheKey, data, s.cacheTTL)
	}

	return response, nil
}

// RecordVisitor records a visitor for an invitation
func (s *InvitationService) RecordVisitor(invitationID int64) error {
	visitor := &domain.Visitor{
		InvitationID: invitationID,
	}

	if err := s.visitorRepo.Create(visitor); err != nil {
		log.Printf("Error recording visitor: %v", err)
		return err
	}

	// Invalidate cache
	invitation, err := s.invitationRepo.GetByID(invitationID)
	if err == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		s.redisClient.Del(ctx, "invitation:"+invitation.Slug)
	}

	return nil
}

// GetInvitationByID retrieves an invitation by ID
func (s *InvitationService) GetInvitationByID(id int64) (*domain.Invitation, error) {
	return s.invitationRepo.GetByID(id)
}

// GetAllInvitations retrieves all invitations
func (s *InvitationService) GetAllInvitations() ([]domain.Invitation, error) {
	return s.invitationRepo.GetAll()
}

// UpdateInvitation updates an invitation
func (s *InvitationService) UpdateInvitation(invitation *domain.Invitation) error {
	if err := s.invitationRepo.Update(invitation); err != nil {
		log.Printf("Error updating invitation: %v", err)
		return err
	}

	// Invalidate cache
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	s.redisClient.Del(ctx, "invitation:"+invitation.Slug)

	return nil
}

// DeleteInvitation deletes an invitation
func (s *InvitationService) DeleteInvitation(id int64) error {
	invitation, err := s.invitationRepo.GetByID(id)
	if err != nil {
		return err
	}

	if err := s.invitationRepo.Delete(id); err != nil {
		log.Printf("Error deleting invitation: %v", err)
		return err
	}

	// Invalidate cache
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	s.redisClient.Del(ctx, "invitation:"+invitation.Slug)

	return nil
}
