-- ============================================
-- DriftSentry Database Functions & Triggers
-- Automatic timestamp management
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updated_at
CREATE TRIGGER update_users_timestamp 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_drifts_timestamp 
  BEFORE UPDATE ON drifts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_alerts_timestamp 
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to validate drift state transition
-- Ensures valid status lifecycle: detected -> triaged -> approved/rejected -> resolved
CREATE OR REPLACE FUNCTION validate_drift_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any transition for new records
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Define valid transitions
  IF OLD.status = 'detected' AND NEW.status NOT IN ('detected', 'triaged', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
  
  IF OLD.status = 'triaged' AND NEW.status NOT IN ('triaged', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
  
  IF OLD.status = 'approved' AND NEW.status NOT IN ('approved', 'resolved') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
  
  IF OLD.status = 'rejected' AND NEW.status NOT IN ('rejected', 'resolved') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
  
  IF OLD.status = 'resolved' THEN
    RAISE EXCEPTION 'Cannot change status of resolved drift';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_drift_status
  BEFORE UPDATE ON drifts
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_drift_status_transition();
