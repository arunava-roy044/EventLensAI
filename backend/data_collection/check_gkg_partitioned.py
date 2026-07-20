from google.cloud import bigquery

client = bigquery.Client(project="eventlens-ai")
table = client.get_table("gdelt-bq.gdeltv2.gkg_partitioned")

print("Partitioning type:", table.time_partitioning.type_)
print("Partitioning field:", table.time_partitioning.field)