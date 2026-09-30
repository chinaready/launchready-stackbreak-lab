// Copyright (c) 2026 Chinaready. All rights reserved.

export const C = {
  primary: '0C1E3E',
  blue: '005BAC',
  text: '0D1B2A',
  text2: '5A6A80',
  border: 'DDE3EE',
  surface: 'F4F6FA',
  onDark: 'FFFFFF',
  onDark2: 'B7C2D6',
  onDark3: '7F95B8',
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let value = 0xFFFFFFFF;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xFF] ^ (value >>> 8);
  return (value ^ 0xFFFFFFFF) >>> 0;
}

export function makeZip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.isBuffer(content) || content instanceof Uint8Array ? content : encoder.encode(content);
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    chunks.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralDirectory.push(central);
    offset += local.length + data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const entry of centralDirectory) {
    chunks.push(entry);
    centralSize += entry.length;
  }
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, centralDirectory.length, true);
  endView.setUint16(10, centralDirectory.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  chunks.push(end);

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function r(run) {
  const value = typeof run === 'string' ? { text: run } : run;
  const properties = [];
  if (value.bold) properties.push('<w:b/><w:bCs/>');
  if (value.italic) properties.push('<w:i/>');
  if (value.color) properties.push(`<w:color w:val="${value.color}"/>`);
  if (value.size) properties.push(`<w:sz w:val="${value.size}"/><w:szCs w:val="${value.size}"/>`);
  if (value.font) properties.push(`<w:rFonts w:ascii="${value.font}" w:hAnsi="${value.font}"/>`);
  if (value.caps) properties.push('<w:caps/>');
  if (value.spc) properties.push(`<w:spacing w:val="${value.spc}"/>`);
  return `<w:r>${properties.length ? `<w:rPr>${properties.join('')}</w:rPr>` : ''}<w:t xml:space="preserve">${esc(value.text ?? '')}</w:t></w:r>`;
}

export function imageRun({ relId, cxEmu, cyEmu, name = 'Chinaready logo' }) {
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"
    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
    xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
    <wp:extent cx="${cxEmu}" cy="${cyEmu}"/><wp:docPr id="${relId.replace(/\D/g, '') || 1}" name="${esc(name)}"/>
    <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>
    <pic:nvPicPr><pic:cNvPr id="0" name="${esc(name)}"/><pic:cNvPicPr/></pic:nvPicPr>
    <pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
    <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cxEmu}" cy="${cyEmu}"/></a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>
    </wp:inline></w:drawing></w:r>`;
}

export function p(options = {}) {
  const properties = [];
  if (options.align) properties.push(`<w:jc w:val="${options.align}"/>`);
  if (options.spaceBefore != null || options.spaceAfter != null) {
    properties.push(`<w:spacing${options.spaceBefore != null ? ` w:before="${options.spaceBefore}"` : ''}${options.spaceAfter != null ? ` w:after="${options.spaceAfter}"` : ''}/>`);
  }
  if (options.shd) properties.push(`<w:shd w:val="clear" w:color="auto" w:fill="${options.shd}"/>`);
  if (options.keepNext) properties.push('<w:keepNext/>');
  const runs = (options.runs || []).map((item) => typeof item === 'string'
    ? (item.startsWith('<w:') ? item : r(item))
    : item.includes?.('<w:') ? item : r(item)).join('');
  return `<w:p>${properties.length ? `<w:pPr>${properties.join('')}</w:pPr>` : ''}${runs}</w:p>`;
}

export function tc({ width, shd, borders, body = [], vAlign = 'top' } = {}) {
  return `<w:tc><w:tcPr>${width ? `<w:tcW w:w="${width}" w:type="dxa"/>` : ''}${shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${shd}"/>` : ''}<w:vAlign w:val="${vAlign}"/>${borders || ''}<w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="150" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="150" w:type="dxa"/></w:tcMar></w:tcPr>${body.join('')}</w:tc>`;
}

export function tr(cells, { header = false, cantSplit = true } = {}) {
  return `<w:tr>${header || cantSplit ? `<w:trPr>${header ? '<w:tblHeader/>' : ''}${cantSplit ? '<w:cantSplit/>' : ''}</w:trPr>` : ''}${cells.join('')}</w:tr>`;
}

export function table(rows, { width = 9412, grid = [9412], borders = true } = {}) {
  const borderXml = borders ? `<w:tblBorders><w:top w:val="single" w:sz="4" w:color="${C.border}"/><w:left w:val="single" w:sz="4" w:color="${C.border}"/><w:bottom w:val="single" w:sz="4" w:color="${C.border}"/><w:right w:val="single" w:sz="4" w:color="${C.border}"/><w:insideH w:val="single" w:sz="4" w:color="${C.border}"/><w:insideV w:val="single" w:sz="4" w:color="${C.border}"/></w:tblBorders>` : '';
  return `<w:tbl><w:tblPr><w:tblW w:w="${width}" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borderXml}</w:tblPr><w:tblGrid>${grid.map((item) => `<w:gridCol w:w="${item}"/>`).join('')}</w:tblGrid>${rows.join('')}</w:tbl>`;
}

export function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}
