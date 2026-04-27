package handler

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"go-invitation-system/domain"
	"go-invitation-system/service"
)

// InvitationHandler handles invitation HTTP requests
type InvitationHandler struct {
	service *service.InvitationService
}

// NewInvitationHandler creates a new invitation handler
func NewInvitationHandler(service *service.InvitationService) *InvitationHandler {
	return &InvitationHandler{service: service}
}

// CreateInvitation handles POST /invitations
func (h *InvitationHandler) CreateInvitation(c echo.Context) error {
	req := new(domain.CreateInvitationRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	invitation, err := h.service.CreateInvitation(req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, invitation)
}

// GetInvitation handles GET /invite/{slug}
func (h *InvitationHandler) GetInvitation(c echo.Context) error {
	slug := c.Param("slug")

	invitation, err := h.service.GetInvitationBySlug(slug)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Invitation not found"})
	}

	// Record visitor asynchronously
	go h.service.RecordVisitor(invitation.ID)

	return c.JSON(http.StatusOK, invitation)
}

// GetAllInvitations handles GET /invitations
func (h *InvitationHandler) GetAllInvitations(c echo.Context) error {
	invitations, err := h.service.GetAllInvitations()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, invitations)
}

// UpdateInvitation handles PUT /invitations/{id}
func (h *InvitationHandler) UpdateInvitation(c echo.Context) error {
	id := c.Param("id")

	invitation := new(domain.Invitation)
	if err := c.Bind(invitation); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	invitation.ID = stringToInt64(id)
	if err := h.service.UpdateInvitation(invitation); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, invitation)
}

// DeleteInvitation handles DELETE /invitations/{id}
func (h *InvitationHandler) DeleteInvitation(c echo.Context) error {
	id := stringToInt64(c.Param("id"))

	if err := h.service.DeleteInvitation(id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Invitation deleted"})
}

// UploadImage handles POST /uploads/image
func (h *InvitationHandler) UploadImage(c echo.Context) error {
	fileHeader, err := c.FormFile("image")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Image file is required"})
	}

	src, err := fileHeader.Open()
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Failed to open image file"})
	}
	defer src.Close()

	buffer := make([]byte, 512)
	readBytes, err := src.Read(buffer)
	if err != nil && err != io.EOF {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Failed to read image file"})
	}

	contentType := http.DetectContentType(buffer[:readBytes])
	if !strings.HasPrefix(contentType, "image/") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Only image files are allowed"})
	}

	if _, err := src.Seek(0, io.SeekStart); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to process image file"})
	}

	if err := os.MkdirAll("uploads", 0o755); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to prepare uploads directory"})
	}

	extension := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if extension == "" {
		switch contentType {
		case "image/jpeg":
			extension = ".jpg"
		case "image/png":
			extension = ".png"
		case "image/webp":
			extension = ".webp"
		case "image/gif":
			extension = ".gif"
		default:
			extension = ".img"
		}
	}

	filename := strconv.FormatInt(time.Now().UnixNano(), 10) + extension
	destinationPath := filepath.Join("uploads", filename)

	dst, err := os.Create(destinationPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to save image file"})
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to write image file"})
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"url": "/" + filepath.ToSlash(destinationPath),
	})
}

func stringToInt64(s string) int64 {
	result, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0
	}

	return result
}
