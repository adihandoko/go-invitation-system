# Go Invitation System

Go Invitation System adalah aplikasi undangan digital berbasis Go, React, PostgreSQL, dan Redis. Project ini berisi REST API untuk mengelola undangan, RSVP tamu, statistik kunjungan, upload gambar, halaman undangan publik, dan dashboard admin berbasis CoreUI.

## Fitur

- CRUD invitation dengan slug unik
- Halaman undangan publik di `/invite/:slug`
- RSVP tamu dengan status `attending`, `maybe`, dan `not_attending`
- Statistik RSVP dan jumlah visitor per invitation
- Upload gambar invitation ke folder `uploads`
- Redis cache untuk detail invitation
- PostgreSQL sebagai database utama
- Frontend publik React + Vite
- Admin dashboard CoreUI
- Docker Compose untuk menjalankan backend, database, cache, frontend, dan admin

## Tech Stack

- Backend: Go 1.21, Echo
- Database: PostgreSQL 15
- Cache: Redis 7
- Frontend: React 18, Vite
- Admin: React 18, CoreUI
- Container: Docker, Docker Compose

## Struktur Project

```text
.
|-- admin-coreui/       # Dashboard admin berbasis CoreUI
|-- config/             # Konfigurasi aplikasi, database, dan Redis
|-- db/                 # Script inisialisasi database
|-- domain/             # Model dan DTO
|-- frontend-react/     # Frontend publik React
|-- handler/            # HTTP handler
|-- repository/         # Akses data PostgreSQL
|-- service/            # Business logic
|-- templates/          # Template referensi CoreUI
|-- uploads/            # File gambar yang di-upload
|-- docker-compose.yml
|-- Dockerfile
|-- go.mod
|-- main.go
`-- README.md
```

## Menjalankan dengan Docker Compose

Pastikan Docker dan Docker Compose sudah terpasang.

```bash
cp .env.example .env
docker compose up -d --build
```

Setelah semua service berjalan:

- API: `http://localhost:8080`
- Frontend publik: `http://localhost:3000`
- Admin dashboard: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Cek health endpoint:

```bash
curl http://localhost:8080/health
```

## Menjalankan Backend Secara Lokal

Prasyarat:

- Go 1.21+
- PostgreSQL 15+
- Redis 7+

Langkah:

```bash
cp .env.example .env
go mod download
psql -U postgres -d invitation_db -f db/init.sql
go run main.go
```

Default API berjalan di `http://localhost:8080`.

## Menjalankan Frontend

Frontend publik:

```bash
cd frontend-react
npm install
npm run dev
```

Admin dashboard:

```bash
cd admin-coreui
npm install
npm run dev
```

Default Vite akan menampilkan URL development di terminal.

## Environment Variables

Contoh konfigurasi tersedia di `.env.example`.

```env
APP_NAME=go-invitation-system
APP_PORT=8080
ENVIRONMENT=development
LOG_LEVEL=info

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=invitation_db

REDIS_HOST=localhost
REDIS_PORT=6379
```

Untuk frontend, gunakan `VITE_API_BASE_URL` jika perlu mengarah ke API tertentu. Untuk admin, tersedia juga `VITE_PUBLIC_SITE_URL` agar link "lihat undangan" mengarah ke frontend publik.

## API Endpoint

### Health

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| GET | `/health` | Cek status aplikasi |

### Invitation

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| POST | `/invitations` | Membuat invitation |
| GET | `/invitations` | Mengambil semua invitation |
| GET | `/invite/:slug` | Mengambil invitation publik berdasarkan slug dan mencatat visitor |
| PUT | `/invitations/:id` | Mengubah invitation |
| DELETE | `/invitations/:id` | Menghapus invitation |
| POST | `/uploads/image` | Upload gambar invitation |

### RSVP

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| POST | `/rsvp` | Mengirim RSVP |
| GET | `/rsvp/:id` | Mengambil detail RSVP |
| GET | `/rsvp/invitation/:id` | Mengambil RSVP berdasarkan invitation |
| PUT | `/rsvp/:id` | Mengubah RSVP |
| DELETE | `/rsvp/:id` | Menghapus RSVP |

### Statistik

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| GET | `/stats/:id` | Statistik invitation berdasarkan ID |
| GET | `/stats/slug/:slug` | Statistik invitation berdasarkan slug |

## Contoh Request

Membuat invitation:

```bash
curl -X POST http://localhost:8080/invitations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wedding Reception",
    "slug": "wedding-reception",
    "image_url_1": "/uploads/example-1.jpg",
    "image_url_2": "",
    "image_url_3": "",
    "event_date": "2026-06-15T18:00:00Z"
  }'
```

Mengambil invitation publik:

```bash
curl http://localhost:8080/invite/wedding-reception
```

Mengirim RSVP:

```bash
curl -X POST http://localhost:8080/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "invitation_id": 1,
    "name": "Guest Name",
    "status": "attending"
  }'
```

Upload gambar:

```bash
curl -X POST http://localhost:8080/uploads/image \
  -F "image=@./photo.jpg"
```

## Perintah Development

Backend:

```bash
go fmt ./...
go test ./...
go run main.go
```

Frontend:

```bash
npm run dev
npm run build
```

Docker:

```bash
docker compose logs -f app
docker compose down
docker compose down -v
```

## Catatan Keamanan

Project ini belum menyertakan authentication/authorization untuk endpoint admin/API. Jika akan dipakai untuk production atau repo publik, pertimbangkan untuk menambahkan login admin, pembatasan CORS, validasi input yang lebih ketat, rate limiting, dan konfigurasi environment yang aman.

Pastikan file `.env`, file lokal sensitif, dan isi folder upload pribadi tidak ikut ter-commit.

## Lisensi

Project ini menggunakan lisensi GPL-3.0. Lihat file [LICENSE](LICENSE) untuk detail.
