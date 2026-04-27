package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"go-invitation-system/domain"
	"go-invitation-system/service"
)

// RSVPHandler handles RSVP HTTP requests
type RSVPHandler struct {
	service *service.RSVPService
}

// NewRSVPHandler creates a new RSVP handler
func NewRSVPHandler(service *service.RSVPService) *RSVPHandler {
	return &RSVPHandler{service: service}
}

// CreateRSVP handles POST /rsvp
func (h *RSVPHandler) CreateRSVP(c echo.Context) error {
	req := new(domain.CreateRSVPRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	rsvp, err := h.service.CreateRSVP(req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, rsvp)
}

// GetRSVP handles GET /rsvp/{id}
func (h *RSVPHandler) GetRSVP(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
	}

	rsvp, err := h.service.GetRSVPByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "RSVP not found"})
	}

	return c.JSON(http.StatusOK, rsvp)
}

// GetRSVPsByInvitation handles GET /rsvp/invitation/{id}
func (h *RSVPHandler) GetRSVPsByInvitation(c echo.Context) error {
	invitationID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
	}

	rsvps, err := h.service.GetRSVPsByInvitationID(invitationID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, rsvps)
}

// UpdateRSVP handles PUT /rsvp/{id}
func (h *RSVPHandler) UpdateRSVP(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
	}

	rsvp := new(domain.RSVP)
	if err := c.Bind(rsvp); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	rsvp.ID = id
	if err := h.service.UpdateRSVP(rsvp); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, rsvp)
}

// DeleteRSVP handles DELETE /rsvp/{id}
func (h *RSVPHandler) DeleteRSVP(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID"})
	}

	if err := h.service.DeleteRSVP(id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "RSVP deleted"})
}
