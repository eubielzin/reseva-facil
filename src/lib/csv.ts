/**
 * CSV para abrir direto no Excel em português: separador ";" (vírgula é decimal no pt-BR),
 * linhas em CRLF e BOM no início para os acentos aparecerem certos.
 */
export function gerarCsv(cabecalho: string[], linhas: string[][]): string {
  const celula = (valor: string) => (/[";\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor)
  const texto = [cabecalho, ...linhas].map((linha) => linha.map(celula).join(';')).join('\r\n')
  return '﻿' + texto
}

/** Faz o navegador baixar o texto como arquivo. */
export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}
