from google.cloud import bigquery

client = bigquery.Client(project="eventlens-ai")

query = """
SELECT COUNT(*) as row_count
FROM `gdelt-bq.gdeltv2.gkg`
WHERE DATE >= 20240101000000 AND DATE < 20240102000000
"""

result = client.query(query).to_dataframe()
print(result)