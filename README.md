# MercadoTracker 🔍

MercadoTracker es una aplicación que monitorea productos en Mercado Libre y detecta nuevas publicaciones o cambios en los precios.

## Características principales

- 🔄 Scraping en tiempo real de productos de Mercado Libre
- 📊 Comparación automática con búsquedas anteriores
- ✨ Detección de nuevas publicaciones
- 💰 Seguimiento de cambios de precios
- 📝 Generación de reportes en formato JSON y TXT

## Tecnologías utilizadas

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Python (Scraping)
- BeautifulSoup4
- Sistema de archivos para almacenamiento

## Estructura del proyecto 
/
├── src/
│ ├── app/ # Rutas y páginas de Next.js
│ └── backend/
│ ├── data/ # Almacenamiento de resultados
│ └── scripts/ # Scripts de Python para scraping
├── public/
└── components/ # Componentes React

## Funcionamiento

El sistema realiza las siguientes operaciones:

1. Recibe términos de búsqueda para productos
2. Ejecuta el scraping en Mercado Libre
3. Almacena los resultados en archivos JSON
4. Compara con búsquedas anteriores
5. Genera reportes detallados de cambios

## API Endpoints

- `POST /api/scrape`: Inicia el proceso de scraping
- `GET /api/results`: Obtiene los últimos resultados
- `GET /api/previous-searches`: Lista búsquedas anteriores

## Instalación

1. Clona el repositorio
2. Instala las dependencias de Node.js:

```bash
npm install
```

3. Instala las dependencias de Python:
```bash
pip install beautifulsoup4 requests
```

4. Crea un archivo `.env` con las variables necesarias

## Uso

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Abre [http://localhost:3000](http://localhost:3000)
