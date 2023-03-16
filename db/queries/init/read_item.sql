    SELECT 
        id, item, quantity, description 
    FROM
        stuff
    WHERE
        id = ?
    AND
        userid = ?