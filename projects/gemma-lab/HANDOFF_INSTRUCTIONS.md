# ☁️ Cloud Handoff Instructions: Fine-Tuning Gemma 3

Since we cannot fine-tune on your local CPU, we use Google Colab (Free Tier) to do the heavy lifting.

## 📦 What We Prepared
1.  **The Notebook**: `projects/gemma-lab/gemma_trainer.ipynb` (Contains the training code)
2.  **The Data**: `projects/gemma-lab/data/training_data.jsonl` (Synthetic NHIS Claims)
3.  **Local Inference**: `projects/gemma-lab/load_model.py` (Updated to load the adapter you bring back)

## 📌 Current Project Status (For Resume)
*   **Strategy**: Done (Target: Claims Fraud).
*   **Data**: Done (500 records generated).
*   **Next Step**: **EXECUTE** this fine-tuning in the cloud.

## 🚀 Step-by-Step Guide

### 1. Open Google Colab
*   Go to: [https://colab.research.google.com/](https://colab.research.google.com/)
*   **Log in** with your Google Account.

### 2. Upload the Notebook
*   Click **File** > **Upload notebook**.
*   Select `projects/gemma-lab/gemma_trainer.ipynb` from your computer.

### 3. Connect to GPU
*   Once loaded, look at the top right. It should say "Connect T4" or similar.
*   If not, go to **Runtime** > **Change runtime type** > Select **T4 GPU**.

### 4. Upload the Data
*   Click the **Folder Icon** 📁 on the left sidebar.
*   Click the **Upload Icon** (Page with Up arrow).
*   Select `projects/gemma-lab/data/training_data.jsonl`.
*   *Note: Detailed warning about runtime recycling might appear; just click OK.*

### 5. Run the Training
*   Go to **Runtime** > **Run all**.
*   Sit back! It should take 5-10 minutes.
*   Watch the loss curves go down! 📉

### 6. Download the Brain (The Adapter)
*   When finished, the notebook creates a folder called `outputs` (or `checkpoint`).
*   Right-click the `outputs` folder in the sidebar.
*   Select **Download** (It might zip it for you, or you might need to zip it first in a code cell).
    *   *Tip: If right-click download fails, add a code cell: `!zip -r nhis_adapter.zip outputs` and download the zip.*

## 🏠 Back at Base (Local)
1.  Unzip the folder to `projects/gemma-lab/adapters/nhis_v1`.
2.  Run your specialist:
    ```powershell
    uv run load_model.py --adapter adapters/nhis_v1
    ```
