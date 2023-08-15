import requests
import xml.etree.ElementTree as ET
import os

### This script downloads all "Schriftliche Anfragen" and "Kleine Anfragen" from PARDOK

# Set output folder
out_folder = "./pardoks"

# PARDOK is available from 11 to 19 election period 
# See: https://www.parlament-berlin.de/Dokumente/Open-Data
wps = list(range(11,20))

def iterate_xml(file_name):
    tree = ET.parse(file_name)
    root = tree.getroot()
    all_schr_anfrs = []
    for elem in root:
        for subelem in elem:
            for subsubelem in subelem:
                if subsubelem.tag == 'LokURL' and (subelem.find('DokTyp').text == "SchrAnfr" or subelem.find('DokTyp').text == "KlAnfr"):
                    all_schr_anfrs += [subsubelem.text]
    return all_schr_anfrs

def download_file(url, filename):
    response = requests.get(url, stream=True)
    with open(filename, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

for wp in wps:
    folder = f"{out_folder}/pardok-wp{wp}"
    file = f"{folder}/pardok-wp{wp}.xml"
    xml_url = f"https://www.parlament-berlin.de/opendata/pardok-wp{wp}.xml"
    os.makedirs(folder, exist_ok=True)
    print("Downloading {} for Wahlperiode {}".format(xml_url, wp))
    download_file(xml_url, file)
    pdfs = iterate_xml(file)
    print(f"-> Found {len(pdfs)} PDFs for Wahlperiode {wp}")
    for idx, pdf in enumerate(pdfs):
        pdf_name = pdf.split("/")[-1]
        pdf_file = f"{folder}/{pdf_name}"
        print(f"--> [{round((idx +1 ) / len(pdfs) * 100,2)}%] Download {pdf_file}")
        download_file(pdf, pdf_file)