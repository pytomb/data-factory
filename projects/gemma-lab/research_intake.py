import argparse
import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin, urlparse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def get_soup(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"⚠️ Error fetching {url}: {e}")
        return None

def extract_text(soup):
    if not soup: return ""
    # Remove script and style elements
    for script in soup(["script", "style", "nav", "footer"]):
        script.extract()
    return soup.get_text(separator='\n').strip()

def scrape_website(base_url):
    print(f"\n🕵️‍♂️ Researching: {base_url}\n")
    
    # 1. Main Page
    main_soup = get_soup(base_url)
    if not main_soup: return
    
    dossier = f"=== ROOT PAGE: {base_url} ===\n"
    dossier += extract_text(main_soup)[:5000] # Cap text
    dossier += "\n\n"

    # 2. Find Key Links (About, Investor, Mission)
    priority_keywords = ['about', 'mission', 'investor', 'strategy', 'press', 'news']
    visited = set()
    visited.add(base_url)
    
    links = []
    for a in main_soup.find_all('a', href=True):
        href = a['href']
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)
        
        # Only internal links or related subdomains
        if parsed.netloc == urlparse(base_url).netloc:
            if full_url not in visited:
                # Check keywords
                score = 0
                for kw in priority_keywords:
                    if kw in full_url.lower() or kw in a.get_text().lower():
                        score += 1
                
                if score > 0:
                    links.append((score, full_url, a.get_text().strip()))
                    visited.add(full_url)

    # Sort by relevance and take top 5
    links.sort(key=lambda x: x[0], reverse=True)
    top_links = links[:5]

    for score, url, text in top_links:
        print(f"   -> Found relevant page: {text} ({url})")
        sub_soup = get_soup(url)
        if sub_soup:
            dossier += f"=== SUB PAGE: {text} ({url}) ===\n"
            dossier += extract_text(sub_soup)[:5000]
            dossier += "\n\n"

    return dossier

def main():
    parser = argparse.ArgumentParser(description="Strategic Research Intake")
    parser.add_argument("url", help="Target Organization Website URL")
    args = parser.parse_args()

    print("--- Starting Strategic Intelligence Gathering ---")
    dossier_content = scrape_website(args.url)
    
    if dossier_content:
        # Save Dossier
        with open("research_dossier.txt", "w", encoding="utf-8") as f:
            f.write(dossier_content)
        
        print("\n✅ Research Dossier compiled: 'research_dossier.txt'")
        print("--- Next Steps ---")
        print("1. Review 'research_dossier.txt'.")
        print("2. Feed this dossier + 'analyst_prompt.md' into your LLM to generate the Strategic Report.")
    else:
        print("❌ Failed to gather intelligent data.")

if __name__ == "__main__":
    main()
