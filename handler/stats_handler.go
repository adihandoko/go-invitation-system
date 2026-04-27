package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"go-invitation-system/service"
)

// StatsHandler handles statistics HTTP requests
type StatsHandler struct {
	rsvpService        *service.RSVPService
	invitationService  *service.InvitationService
}

// NewStatsHandler creates a new stats handler
func NewStatsHandler(rsvpService *service.RSVPService, invitationService *service.InvitationService) *StatsHandler {
	return &StatsHandler{
		rsvpService:       rsvpService,
		invitationService: invitationService,
	}
}

// GetStats handles GET /stats/{id}
func (h *StatsHandler) GetStats(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
	}

	rsvpStats, err := h.rsvpService.GetRSVPStats(id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	response := map[string]interface{}{
		"rsvp_stats": rsvpStats,
	}

	return c.JSON(http.StatusOK, response)
}

// GetStatsBySlug handles GET /stats/slug/{slug}
func (h *StatsHandler) GetStatsBySlug(c echo.Context) error {
	slug := c.Param("slug")

	invitation, err := h.invitationService.GetInvitationBySlug(slug)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Invitation not found"})
	}

	response := map[string]interface{}{
		"invitation": invitation,
	}

	return c.JSON(http.StatusOK, response)
}

// HealthCheck handles GET /health
func (h *StatsHandler) HealthCheck(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
}
