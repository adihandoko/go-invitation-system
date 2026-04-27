package main

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go-invitation-system/config"
	"go-invitation-system/handler"
	"go-invitation-system/repository"
	"go-invitation-system/service"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := config.NewDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	redisClient, err := config.NewRedisClient(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer redisClient.Close()

	// Initialize repositories
	invitationRepo := repository.NewInvitationRepository(db)
	rsvpRepo := repository.NewRSVPRepository(db)
	visitorRepo := repository.NewVisitorRepository(db)

	// Initialize services
	invitationService := service.NewInvitationService(invitationRepo, rsvpRepo, visitorRepo, redisClient)
	rsvpService := service.NewRSVPService(rsvpRepo, invitationRepo, redisClient)

	// Initialize handlers
	invitationHandler := handler.NewInvitationHandler(invitationService)
	rsvpHandler := handler.NewRSVPHandler(rsvpService)
	statsHandler := handler.NewStatsHandler(rsvpService, invitationService)

	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE},
	}))

	// Routes
	setupRoutes(e, invitationHandler, rsvpHandler, statsHandler)

	// Start server
	log.Printf("Starting server on port %s", cfg.AppPort)
	if err := e.Start(":" + cfg.AppPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRoutes(e *echo.Echo, ih *handler.InvitationHandler, rh *handler.RSVPHandler, sh *handler.StatsHandler) {
	e.GET("/", func(c echo.Context) error {
		return c.File("web/index.html")
	})
	e.Static("/assets", "web/assets")
	e.Static("/uploads", "uploads")
	e.GET("/favicon.ico", func(c echo.Context) error {
		return c.NoContent(http.StatusNoContent)
	})

	// Health check
	e.GET("/health", sh.HealthCheck)

	// Invitation routes
	e.POST("/invitations", ih.CreateInvitation)
	e.GET("/invitations", ih.GetAllInvitations)
	e.GET("/invite/:slug", ih.GetInvitation)
	e.PUT("/invitations/:id", ih.UpdateInvitation)
	e.DELETE("/invitations/:id", ih.DeleteInvitation)
	e.POST("/uploads/image", ih.UploadImage)

	// RSVP routes
	e.POST("/rsvp", rh.CreateRSVP)
	e.GET("/rsvp/:id", rh.GetRSVP)
	e.GET("/rsvp/invitation/:id", rh.GetRSVPsByInvitation)
	e.PUT("/rsvp/:id", rh.UpdateRSVP)
	e.DELETE("/rsvp/:id", rh.DeleteRSVP)

	// Stats routes
	e.GET("/stats/:id", sh.GetStats)
	e.GET("/stats/slug/:slug", sh.GetStatsBySlug)
}
