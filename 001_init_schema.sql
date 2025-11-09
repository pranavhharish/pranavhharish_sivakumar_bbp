-- Migration: Initialize Fermentation Data Platform Schema
-- Created: 2025-11-09
-- Description: Create run_client and run_time_series_data tables with indexes

-- Table: run_client
-- Stores metadata about fermentation runs
CREATE TABLE IF NOT EXISTS run_client (
  run_id VARCHAR(20) PRIMARY KEY,
  client_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: run_time_series_data
-- Stores time-series data points for each run
CREATE TABLE IF NOT EXISTS run_time_series_data (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(20) REFERENCES run_client(run_id) ON DELETE CASCADE,
  time_stamp FLOAT NOT NULL,
  parameter VARCHAR(50) NOT NULL,
  process_value FLOAT NOT NULL,
  units VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_run_time_series_run_id ON run_time_series_data(run_id);
CREATE INDEX IF NOT EXISTS idx_run_time_series_parameter ON run_time_series_data(parameter);
