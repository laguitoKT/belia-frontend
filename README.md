# Belia — Gestión de salón de belleza

Belia es una aplicación web para centralizar la operación diaria de un salón de
belleza. Este repositorio contiene el frontend: una interfaz para que el equipo
organice citas, consulte la información del negocio y gestione sus recursos desde
un solo lugar.

## Propósito

El proyecto busca facilitar la coordinación entre la administración y el
personal del salón, ofreciendo una vista clara de la agenda y de las tareas
operativas. La interfaz se adapta al rol de la persona usuaria para mostrar
información relevante para la gestión general o para el trabajo diario de cada
especialista.

## Áreas de gestión

- **Inicio y seguimiento diario:** resumen de citas, actividad del día e
  inventario.
- **Citas:** consulta y gestión de la agenda y del estado de las citas.
- **Servicios:** administración del catálogo de servicios y paquetes.
- **Clientes:** consulta de clientes e historial relacionado con sus citas.
- **Inventario:** seguimiento de productos, existencias y alertas de stock.
- **Empleados:** gestión del equipo y consulta de su actividad; esta sección
  está destinada a administración.

## Organización del repositorio

La aplicación está desarrollada con React y Vite. El código de la interfaz se
organiza por áreas funcionales en `src/features`, mientras que los componentes
compartidos, el contexto de sesión y tema, las rutas y las utilidades se
encuentran en sus directorios correspondientes dentro de `src`.

Los servicios de cada área encapsulan la comunicación con la API del backend.
Este repositorio se centra en la experiencia de usuario y la presentación de
las funciones de gestión de Belia.
