import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime
import glob
import sys
import time
import random

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

if len(sys.argv) > 1:
    SEARCH_TERM = sys.argv[1]
else:
    SEARCH_TERM = "Toyota Corolla Cross"  # valor por defecto

class Logger:
    """
    Clase para redirigir todo lo que se imprime en consola también a un archivo.
    """
    def __init__(self, filename):
        self.console = sys.stdout
        self.log = open(filename, "w", encoding="utf-8", buffering=1)

    def write(self, message):
        self.console.write(message)
        self.console.flush()
        self.log.write(message)
        self.log.flush()

    def flush(self):
        self.console.flush()
        self.log.flush()

def construir_url(busqueda, desde=None):
    """
    Construye la URL de búsqueda en Mercado Libre para el término dado.
    Si 'desde' es None, construye la URL de la primera página.
    De lo contrario, construye la URL de las páginas siguientes utilizando el parámetro 'Desde'.
    """
    busqueda_formateada = busqueda.replace(" ", "-").lower()
    if desde is None:
        # Primera página - sin codificar los corchetes
        return f"https://listado.mercadolibre.com.ar/{busqueda_formateada}#D[A:{busqueda}]"
    else:
        # Páginas siguientes
        return f"https://listado.mercadolibre.com.ar/{busqueda_formateada}_Desde_{desde}_NoIndex_True"

def scrape_productos(url):
    """
    Realiza el scraping de la página dada y extrae los productos.
    Retorna una tupla (productos, next_url)
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": "https://www.mercadolibre.com.ar/",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
    }
    
    # Aumentar el delay aleatorio entre 2 y 5 segundos
    time.sleep(2 + random.random() * 3)
    
    max_intentos = 3
    for intento in range(max_intentos):
        try:
            session = requests.Session()
            response = session.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Verificar si fuimos redirigidos a una página de captcha o error
            if "captcha" in response.url.lower() or "error" in response.url.lower():
                print(f"⚠️ Intento {intento + 1}/{max_intentos}: Detectado captcha o página de error")
                if intento < max_intentos - 1:
                    time.sleep(5 + random.random() * 5)  # Esperar más tiempo entre intentos
                    continue
                return [], None
                
            return procesar_pagina(response)
            
        except requests.RequestException as e:
            print(f"⚠️ Intento {intento + 1}/{max_intentos}: Error al acceder a la página: {e}")
            if intento < max_intentos - 1:
                time.sleep(5 + random.random() * 5)
                continue
            return [], None
    
    return [], None

def procesar_pagina(response):
    """
    Procesa el contenido de la página y extrae productos y siguiente URL
    """
    soup = BeautifulSoup(response.content, "html.parser")
    productos = []
    
    # Verificar si la página está vacía o tiene contenido válido
    if not soup.find_all("li", class_="ui-search-layout__item"):
        print("⚠️ No se encontraron productos en la página")
        return [], None
        
    print("🔄 Scrapeando la página de Mercado Libre...")
    
    for item in soup.find_all("li", class_="ui-search-layout__item"):
        try:
            titulo_tag = item.find("a")
            titulo = titulo_tag.text.strip() if titulo_tag else "No disponible"
            enlace = titulo_tag["href"] if titulo_tag and "href" in titulo_tag.attrs else "No disponible"
            precio_tag = item.find("span", class_="andes-money-amount__fraction")
            precio = precio_tag.text.strip() if precio_tag else "No disponible"
            productos.append({
                "titulo": titulo,
                "precio": precio,
                "enlace": enlace
            })
        except Exception as e:
            continue

    # Buscar el enlace de la siguiente página
    print("\n🔍 Buscando sección de paginación...")
    
    # Primero intentamos con la clase ui-search-andes-pagination
    pagination = soup.find("ul", class_="ui-search-andes-pagination")
    if pagination:
        print("✅ Encontrada la sección de paginación (método 1)")
    else:
        # Si no funciona, intentamos con la clase andes-pagination
        pagination = soup.find("ul", class_="andes-pagination")
        if pagination:
            print("✅ Encontrada la sección de paginación (método 2)")
        else:
            print("❌ No se encontró la sección de paginación")
            print("\n🔍 HTML cercano a la paginación:")
            nav = soup.find("nav", {"aria-label": "Paginación"})
            if nav:
                print(nav.prettify())
            else:
                print("No se encontró el nav de paginación")

    if pagination:
        next_button = pagination.find("li", class_="andes-pagination__button--next")
        if next_button:
            print("✅ Encontrado el botón siguiente")
            next_link = next_button.find("a")
            if next_link and "href" in next_link.attrs:
                next_url = next_link["href"]
                print(f"🔍 URL del botón siguiente: {next_url}")
                return productos, next_url
            else:
                print("❌ No se encontró el enlace dentro del botón siguiente")
        else:
            print("❌ No se encontró el botón siguiente dentro de la paginación")

    # Búsqueda alternativa directa
    next_button = soup.find("li", class_="andes-pagination__button--next")
    if next_button:
        print("✅ Encontrado el botón siguiente (búsqueda alternativa)")
        next_link = next_button.find("a")
        if next_link and "href" in next_link.attrs:
            next_url = next_link["href"]
            print(f"🔍 URL del botón siguiente: {next_url}")
            return productos, next_url

    return productos, None

def eliminar_duplicados(productos):
    """
    Elimina productos duplicados basados en título y precio.
    """
    unique = []
    seen = set()
    for p in productos:
        key = (p['titulo'], p['precio'])
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique

def guardar_json(productos, busqueda):
    """
    Guarda los productos en un archivo JSON con nombre que incluye búsqueda, fecha y hora.
    """
    ahora = datetime.now()
    fecha_hora = ahora.strftime("%Y%m%d_%H%M%S")
    busqueda_formateada = busqueda.replace(" ", "_")
    nombre_archivo = os.path.join(OUTPUT_DIR, f"{busqueda_formateada}_{fecha_hora}.json")
    with open(nombre_archivo, "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, indent=4)
    print(f"✅ Datos guardados en '{nombre_archivo}'")
    return nombre_archivo

def encontrar_json_mas_reciente(busqueda, exclude_file):
    """
    Encuentra el archivo JSON más reciente para la búsqueda dada, excluyendo el archivo actual.
    """
    busqueda_formateada = busqueda.replace(" ", "_")
    patron = os.path.join(OUTPUT_DIR, f"{busqueda_formateada}_*.json")
    archivos = glob.glob(patron)
    archivos = [archivo for archivo in archivos if archivo != exclude_file]
    if not archivos:
        return None
    archivos.sort(reverse=True)  # Orden descendente
    return archivos[0]

def cargar_json(archivo):
    """
    Carga los datos desde un archivo JSON.
    """
    with open(archivo, "r", encoding="utf-8") as f:
        datos = json.load(f)
    return datos

def imprimir_resumen_nuevos(nuevos_productos):
    """
    Imprime el resumen de los nuevos productos encontrados.
    """
    print("_________________________________________________________________________________\n")
    print("🆕 Nuevos productos encontrados:\n")
    for producto in nuevos_productos:
        print(f"{producto['titulo']} - $ {producto['precio']}")
        print(f"{producto['enlace']}\n")
    print("_________________________________________________________________________________")

def limpiar_archivos_antiguos(busqueda):
    """
    Mantiene solo los 3 archivos JSON más recientes para una búsqueda específica.
    """
    busqueda_formateada = busqueda.replace(" ", "_")
    patron = os.path.join(OUTPUT_DIR, "*.json")
    archivos = glob.glob(patron)
    
    # Filtramos para asegurarnos de que coincida exactamente con el término de búsqueda
    archivos_busqueda = []
    for archivo in archivos:
        nombre_base = os.path.basename(archivo)
        # Extraemos el nombre base eliminando el patrón _YYYYMMDD_HHMMSS.json
        nombre_sin_fecha = nombre_base.split('_20')[0]  # Corta en el año 20XX
        
        if nombre_sin_fecha == busqueda_formateada:
            archivos_busqueda.append(archivo)
    
    # Debug: imprimir información
    print(f"🔍 Término de búsqueda formateado: {busqueda_formateada}")
    print(f"📁 Archivos encontrados para esta búsqueda: {len(archivos_busqueda)}")
    for arch in archivos_busqueda:
        print(f"   - {os.path.basename(arch)}")
    
    # Si hay 3 o menos archivos, no hacemos nada
    if len(archivos_busqueda) <= 3:
        return
    
    # Ordenamos los archivos por fecha de modificación (más reciente primero)
    archivos_busqueda.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    
    # Conservamos los 3 primeros y eliminamos el resto
    archivos_a_eliminar = archivos_busqueda[3:]
    
    # Eliminamos los archivos y sus correspondientes .txt
    for archivo in archivos_a_eliminar:
        try:
            os.remove(archivo)
            txt_archivo = archivo.replace('.json', '.txt')
            if os.path.exists(txt_archivo):
                os.remove(txt_archivo)
            print(f"🗑️ Archivo antiguo eliminado: {os.path.basename(archivo)}")
        except Exception as e:
            print(f"❌ Error al eliminar archivo {os.path.basename(archivo)}: {str(e)}")

def main():
    busqueda = SEARCH_TERM
    print("🔍 Buscando productos en Mercado Libre...\n")
    
    all_productos = []
    
    # 2. Scrappear la primera página
    url = construir_url(busqueda)
    print(f"🌐 URL de búsqueda (primera página): {url}")
    
    while True:
        productos, next_url = scrape_productos(url)
        if not productos:
            print("🔚 No se encontraron más productos. Finalizando scraping.")
            break

        productos = eliminar_duplicados(productos)
        print(f"📦 Se encontraron {len(productos)} productos únicos en esta página.\n")
        all_productos.extend(productos)

        if not next_url:
            print("🔚 No hay más páginas disponibles. Finalizando scraping.")
            break

        url = next_url
        print(f"🌐 URL de búsqueda (siguiente página): {url}")
    
    # 4. Eliminar duplicados de todas las páginas scrapeadas
    all_productos = eliminar_duplicados(all_productos)
    print(f"📦 Total de productos únicos scrapeados: {len(all_productos)}\n")
    
    if not all_productos:
        print("❌ No se encontraron productos tras procesar todas las páginas. Terminando el script.")
        return
    
    # 5. Guardar los datos en un archivo JSON
    archivo_actual = guardar_json(all_productos, busqueda)
    
    # 6. Redirigir la consola a un archivo .txt
    log_filename = archivo_actual.replace(".json", ".txt")
    sys.stdout = Logger(log_filename)
    
    # 7. Encontrar el archivo JSON más reciente anterior
    archivo_anterior = encontrar_json_mas_reciente(busqueda, archivo_actual)
    nuevos_productos = []
    
    if archivo_anterior:
        productos_anteriores = cargar_json(archivo_anterior)
        productos_anteriores = eliminar_duplicados(productos_anteriores)
        print(f"📄 Archivo anterior encontrado: '{archivo_anterior}'")
        print(f"📦 Se encontraron {len(productos_anteriores)} productos únicos en el JSON anterior.\n")
        
        anteriores_dict = {}
        for item in productos_anteriores:
            titulo = item['titulo']
            precio = item['precio']
            if titulo in anteriores_dict:
                anteriores_dict[titulo].add(precio)
            else:
                anteriores_dict[titulo] = set([precio])
        
        print("🔍 Comparando productos actuales con los anteriores...\n")
        
        for producto in all_productos:
            titulo = producto['titulo']
            precio = producto['precio']
            if titulo in anteriores_dict:
                if precio in anteriores_dict[titulo]:
                    print(f"❌ {titulo} - $ {precio} - Existía ❌")
                else:
                    print(f"✅ {titulo} - $ {precio} - PUBLICACIÓN NUEVA!!! ✅✅✅")
                    nuevos_productos.append(producto)
            else:
                print(f"✅ {titulo} - $ {precio} - PUBLICACIÓN NUEVA!!! ✅✅✅")
                nuevos_productos.append(producto)
    else:
        print("🆕 No se encontró un archivo anterior para comparar. Todos los productos son nuevos.\n")
        nuevos_productos = all_productos[:]
        for producto in nuevos_productos:
            titulo = producto['titulo']
            precio = producto['precio']
            print(f"✅ {titulo} - $ {precio} - PUBLICACIÓN NUEVA!!! ✅✅✅")
    
    imprimir_resumen_nuevos(nuevos_productos)
    
    # Limpiar archivos antiguos al final
    limpiar_archivos_antiguos(busqueda)

if __name__ == "__main__":
    main()