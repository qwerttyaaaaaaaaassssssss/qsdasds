
import React, { useRef } from 'react';
import { PreviewContent } from '../types';
import { XIcon, DownloadIcon, FileTextIcon, CodeIcon } from './Icons';

// Make jspdf and html2canvas available in the scope, assuming they are loaded from CDN
declare const jspdf: any;
declare const html2canvas: any;

interface PreviewPanelProps {
    content: PreviewContent;
    onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, onClose }) => {
    const previewRef = useRef<HTMLDivElement>(null);

    const handleDownload = (text: string, filename: string) => {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        if (!previewRef.current) return;
        
        try {
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'pt', 'a4');
            const canvas = await html2canvas(previewRef.current, {
                scale: 2,
                backgroundColor: '#1e293b', // slate-800
                useCORS: true, 
            });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('cebola-documento.pdf');

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Desculpe, ocorreu um erro ao gerar o PDF.");
        }
    };


    const title = content.type === 'html' ? 'Visualização do Site' : 'Visualização do Documento';
    const language = content.language || 'html';

    return (
        <div className="w-1/2 flex-shrink-0 border-l border-slate-700 flex flex-col h-full bg-slate-800 transition-all duration-300 ease-in-out">
           <header className="p-3 flex items-center justify-between bg-slate-900 border-b border-slate-700 flex-shrink-0">
                <h3 className="font-semibold text-white">{title}</h3>
                <div className="flex items-center gap-2">
                    {content.type === 'document' && (
                        <>
                            <button onClick={() => handleDownload(content.content, 'documento.txt')} className="p-1.5 text-slate-400 hover:text-white" aria-label="Baixar como TXT">
                                <FileTextIcon className="w-5 h-5"/>
                            </button>
                             <button onClick={handleDownloadPdf} className="p-1.5 text-slate-400 hover:text-white" aria-label="Baixar como PDF">
                                <DownloadIcon className="w-5 h-5"/>
                            </button>
                        </>
                    )}
                    {content.type === 'html' && (
                         <button onClick={() => handleDownload(content.content, `site.html`)} className="p-1.5 text-slate-400 hover:text-white" aria-label="Baixar HTML">
                            <CodeIcon className="w-5 h-5"/>
                        </button>
                    )}

                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white" aria-label="Fechar painel">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>
           </header>
           <div className="flex-grow overflow-auto">
                {content.type === 'html' ? (
                     <iframe
                        srcDoc={content.content}
                        title={title}
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-modals allow-forms"
                    />
                ) : (
                    <div ref={previewRef} className="p-6 prose prose-invert prose-sm max-w-none break-words custom-scrollbar">
                        <pre className="whitespace-pre-wrap font-sans">{content.content}</pre>
                    </div>
                )}
           </div>
        </div>
    );
};
