declare module "html2canvas" {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    backgroundColor?: string | null;
    logging?: boolean;
    windowWidth?: number;
    [key: string]: unknown;
  }
  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>;
  export default html2canvas;
}

declare module "jspdf" {
  interface JsPDFOptions {
    orientation?: "portrait" | "landscape";
    unit?: "pt" | "mm" | "cm" | "in" | "px";
    format?: string | number[];
    [key: string]: unknown;
  }
  export class jsPDF {
    constructor(options?: JsPDFOptions);
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: string
    ): void;
    addPage(): void;
    output(type: "blob"): Blob;
    output(type: string): unknown;
  }
}
