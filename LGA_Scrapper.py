import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime
import glob
import sys

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
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
        self.log = open(filename, "w", encoding="utf-8")

    def write(self, message):
        self.console.write(message)
        self.log.write(message)

    def flush(self):
        self.console.flush()
        self.log.flush()

def construir_url(busqueda, desde=None):
    """
    Construye la URL de búsqueda en Mercado Libre para el término dado.
    Si 'desde' es None, construye la URL de la primera página.
    De lo contrario, construye la URL de las páginas siguientes utilizando el parámetro 'Desde'.
    """
    busqueda_formateada = busqueda.replace(" ", "-")
    if desde is None:
        # Primera página
        # URL con el formato: https://listado.mercadolibre.com.ar/toyota-corolla-cross#D[A:toyota%20corolla%20cross]
        return f"https://listado.mercadolibre.com.ar/{busqueda_formateada}#D[A:{busqueda.replace(' ', '%20')}]"
    else:
        # Páginas siguientes
        # URL con el formato: https://autos.mercadolibre.com.ar/toyota/corolla-cross/toyota-corolla-cross_Desde_49_NoIndex_True
        palabras = busqueda.split()
        marca = palabras[0].lower()
        modelo = '-'.join(palabras[1:]).lower()
        return f"https://autos.mercadolibre.com.ar/{marca}/{modelo}/{busqueda_formateada}_Desde_{desde}_NoIndex_True"

def scrape_productos(url):
    """
    Realiza el scraping de la página dada y extrae los productos.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                      " AppleWebKit/537.36 (KHTML, like Gecko)"
                      " Chrome/85.0.4183.102 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"❌ Error al acceder a la página: {e}")
        return []

    soup = BeautifulSoup(response.content, "html.parser")
    productos = []
    
    # Indicador de inicio de scraping
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
    return eliminar_duplicados(productos)

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
    print("\n\n____________________________________\n\n")
    print("🆕 Nuevos productos encontrados:\n")
    for producto in nuevos_productos:
        print(f"{producto['titulo']} - $ {producto['precio']}")
        print(f"{producto['enlace']}\n")
    print("____________________________________")

def main():
    # 1. Definir el término de búsqueda
    busqueda = SEARCH_TERM
    
    print("🔍 Buscando productos en Mercado Libre...")
    
    all_productos = []
    
    # 2. Scrappear la primera página
    url_first = construir_url(busqueda)
    print(f"🌐 URL de búsqueda (primera página): {url_first}")
    productos = scrape_productos(url_first)
    print(f"📦 Se encontraron {len(productos)} productos únicos en la primera página.\n")
    all_productos.extend(productos)
    
    if not productos:
        print("❌ No se encontraron productos en la primera página. Terminando el script.")
        return
    
    # 3. Iterar a través de las páginas siguientes
    desde = 49  # Inicio desde 49 para la segunda página
    while True:
        url = construir_url(busqueda, desde)
        print(f"🌐 URL de búsqueda (desde {desde}): {url}")
        productos = scrape_productos(url)
        
        if not productos:
            print("🔚 No se encontraron más productos. Finalizando scraping.")
            break
        
        print(f"📦 Se encontraron {len(productos)} productos únicos en la página con Desde_{desde}.\n")
        all_productos.extend(productos)
        
        desde += 48  # Incrementar para la siguiente página
    
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
    
    # Restaurar stdout
    sys.stdout = sys.stdout.console

if __name__ == "__main__":
    main()