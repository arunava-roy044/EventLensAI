from google.cloud import bigquery

client = bigquery.Client(project="eventlens-ai")
tables = client.list_tables("gdelt-bq.gdeltv2")

for t in tables:
    print(t.table_id)