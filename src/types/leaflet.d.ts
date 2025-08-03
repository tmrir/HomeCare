import 'leaflet';

declare module 'leaflet' {
  interface IconOptions {
    _getIconUrl?: string;
  }

  namespace TileLayer {
    function wms(baseUrl: string, options: any): any;
  }
}
