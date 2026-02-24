/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, BookOpen, Languages, ChevronRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processArabicPdf } from './services/geminiService';
import { ProcessingResult, TranslationPair } from './types';

export default function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [currentPdfBase64, setCurrentPdfBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        setCurrentPdfBase64(base64Data);
        try {
          const data = await processArabicPdf(base64Data, 1);
          setResult(data);
        } catch (err) {
          setError('Failed to process the PDF. Please try again.');
          console.error(err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error reading file.');
      setIsUploading(false);
    }
  };

  const loadNextPage = async () => {
    if (!result || !currentPdfBase64 || isLoadingNext) return;

    setIsLoadingNext(true);
    try {
      const nextPage = result.currentPage + 1;
      const nextData = await processArabicPdf(currentPdfBase64, nextPage);
      
      setResult(prev => {
        if (!prev) return nextData;
        return {
          ...nextData,
          content: [...prev.content, ...nextData.content],
          currentPage: nextPage,
          hasMore: nextData.hasMore
        };
      });
    } catch (err) {
      setError('Failed to load the next page.');
      console.error(err);
    } finally {
      setIsLoadingNext(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <h1 className="font-serif text-xl font-bold tracking-tight">Turjuman</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-500">
            <a href="#" className="hover:text-stone-900 transition-colors">Library</a>
            <a href="#" className="hover:text-stone-900 transition-colors">History</a>
            <button 
              onClick={triggerUpload}
              className="bg-stone-900 text-white px-4 py-2 rounded-full hover:bg-stone-800 transition-all flex items-center gap-2"
            >
              <Upload size={14} />
              <span>Upload PDF</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {!result && !isUploading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-20"
          >
            <h2 className="text-5xl font-serif mb-6 leading-tight">
              Bring Arabic literature to life with <span className="italic text-stone-500">precision</span>.
            </h2>
            <p className="text-lg text-stone-600 mb-10">
              Upload any Arabic book PDF. Our AI generates transcription with complete tashkeel and English translation, <span className="font-semibold">one page at a time</span>.
            </p>
            
            <div 
              onClick={triggerUpload}
              className="group relative border-2 border-dashed border-stone-300 rounded-3xl p-12 cursor-pointer hover:border-stone-900 transition-all bg-stone-50/50"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf" 
                className="hidden" 
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-stone-400 group-hover:text-stone-900" />
                </div>
                <div>
                  <p className="font-medium text-lg">Click to upload or drag and drop</p>
                  <p className="text-stone-500 text-sm">Arabic PDF books (Max 20MB)</p>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>
            )}
          </motion.div>
        )}

        {isUploading && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <Loader2 className="w-full h-full text-stone-900 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Languages size={24} className="text-stone-400" />
              </div>
            </div>
            <h3 className="text-2xl font-serif mb-2">Analyzing Page 1...</h3>
            <p className="text-stone-500">Transcribing Arabic with tashkeel and translating to English.</p>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-8">
              <div>
                <div className="flex items-center gap-2 text-stone-500 text-sm uppercase tracking-widest mb-2">
                  <FileText size={14} />
                  <span>Processed Document • Page {result.currentPage}</span>
                </div>
                <h2 className="text-4xl font-serif">{result.title || 'Untitled Arabic Work'}</h2>
                {result.author && <p className="text-xl text-stone-500 italic mt-1">by {result.author}</p>}
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 text-sm font-medium bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-full transition-colors">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {result.content.map((pair, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group grid grid-cols-1 md:grid-cols-2 gap-8 p-6 rounded-2xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100"
                >
                  <div className="arabic-text text-3xl leading-[1.8] text-stone-900">
                    {pair.arabic}
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-stone-400 mb-2">
                      <div className="h-px flex-1 bg-stone-200"></div>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Translation</span>
                      <div className="h-px w-4 bg-stone-200"></div>
                    </div>
                    <p className="text-lg text-stone-600 leading-relaxed">
                      {pair.english}
                    </p>
                    {pair.numberPronunciation && (
                      <div className="mt-4 p-3 bg-stone-100/50 rounded-xl border border-stone-200/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Number Pronunciation</span>
                        <p className="arabic-text text-xl text-stone-700">
                          {pair.numberPronunciation}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Next Page Button */}
            <div className="flex flex-col items-center py-12 border-t border-stone-100">
              {result.hasMore ? (
                <button
                  onClick={loadNextPage}
                  disabled={isLoadingNext}
                  className="group flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-full hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingNext ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Generating Page {result.currentPage + 1}...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Next Page</span>
                      <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              ) : (
                <div className="text-stone-400 font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-stone-200"></div>
                  <span>End of Document</span>
                  <div className="w-2 h-2 rounded-full bg-stone-200"></div>
                </div>
              )}
              {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
            </div>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-stone-200 py-12 bg-stone-50 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <BookOpen size={18} />
            <span className="font-serif font-bold">Turjuman</span>
          </div>
          <p className="text-stone-400 text-sm">
            Powered by Gemini AI • Professional Arabic Linguistics Engine
          </p>
          <div className="flex gap-6 text-stone-400 text-sm">
            <a href="#" className="hover:text-stone-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-stone-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
