# Recent Downloads

Show recent files downloaded inside desktop and download folder, copy file to clipboard, delete, go to the folder

## Descripción

Esta extensión de Raycast muestra los archivos recientemente descargados en tus carpetas configuradas (por defecto la carpeta Downloads). Permite:

- Ver archivos descargados recientemente
- Copiar archivos al portapapeles
- Eliminar archivos
- Navegar a la ubicación del archivo
- Configurar hasta 5 carpetas diferentes para monitorear

## Requisitos Previos

Antes de instalar esta extensión, asegúrate de tener:

1. **Raycast** instalado en tu Mac ([descargar aquí](https://www.raycast.com/))
2. **Node.js** instalado (versión 18 o superior recomendada)
   ```bash
   # Verificar si Node.js está instalado
   node --version

   # Si no está instalado, instalar con Homebrew
   brew install node
   ```

## Instalación

### Opción 1: Modo Desarrollo (para probar y modificar)

1. Navega al directorio del proyecto:
   ```bash
   cd "/Users/alcibiades/Library/Mobile Documents/com~apple~CloudDocs/Documents/Raycast/raycast-recent-download"
   ```

2. Instala las dependencias (solo la primera vez):
   ```bash
   npm install
   ```

3. Inicia en modo desarrollo:
   ```bash
   npm run dev
   ```

4. La extensión aparecerá automáticamente en Raycast
5. Mantén la terminal abierta mientras uses la extensión

### Opción 2: Instalación Permanente en Raycast

1. Navega al directorio del proyecto:
   ```bash
   cd "/Users/alcibiades/Library/Mobile Documents/com~apple~CloudDocs/Documents/Raycast/raycast-recent-download"
   ```

2. Instala las dependencias (si aún no lo has hecho):
   ```bash
   npm install
   ```

3. Compila la extensión:
   ```bash
   npm run build
   ```

4. En Raycast:
   - Abre Raycast (⌘ + Espacio)
   - Busca "Import Extension"
   - Selecciona la carpeta del proyecto
   - La extensión quedará instalada permanentemente

## Uso

1. Abre Raycast (⌘ + Espacio o ⌥ + Espacio)
2. Escribe "Recent Downloads"
3. Verás la lista de archivos recientemente descargados
4. Selecciona un archivo y presiona:
   - **Enter**: Abrir archivo
   - **⌘ + C**: Copiar archivo al portapapeles
   - **⌘ + Shift + F**: Mostrar en Finder
   - **⌘ + Backspace**: Eliminar archivo

## Configuración

Para configurar carpetas adicionales:

1. En Raycast, busca "Recent Downloads"
2. Presiona ⌘ + K para abrir acciones
3. Selecciona "Configure Extension"
4. Añade hasta 5 carpetas para monitorear

## Scripts Disponibles

- `npm run dev` - Ejecuta en modo desarrollo
- `npm run build` - Compila la extensión
- `npm run lint` - Verifica el código
- `npm run fix-lint` - Corrige errores de linting automáticamente
- `npm run publish` - Publica en Raycast Store (requiere cuenta)

## Solución de Problemas

### "command not found: npm"
Necesitas instalar Node.js:
```bash
brew install node
```

### La extensión no aparece en Raycast
1. Asegúrate de que Raycast esté instalado
2. Verifica que `npm run dev` esté ejecutándose sin errores
3. Reinicia Raycast completamente

### Errores al instalar dependencias
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

## Licencia

MIT

## Autor

Alcibiades