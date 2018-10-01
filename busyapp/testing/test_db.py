from django.test import TestCase #this inherits from unittest.TestCase
from busyapp import ml
from sklearn.externals import joblib
import datetime
import json
import psycopg2
import os


class ModelTest(TestCase):
    #run your setup here (if any)
    def setUp(self):
        pass


    #example test...
    def test_simple_check(self):
        self.assertEqual(1, 1)
        self.assertTrue(True)
        self.assertFalse(False)
        with self.assertRaises(Exception):
            raise Exception

    def test_db_connect(self):
        # Connect to db
        conn = psycopg2.connect("dbname=dfb6d81u4nkjvn user=wjsijzcxzxlrjv")

        # Open a cursor to perform db operation
        cur = conn.cursor()

        # Execute a command: this creates a new table
        # Should return 46a in direction 0 with stops 810 and 2795 as prognum 4 and 23
        cur.execute("SELECT * FROM stops WHERE id = 16680;")

        # Obtain data as Python object
        result = cur.fetchone()

        # Print result
        print(result)

        cur.close()
        conn.close()


    #run your clean up here (if any)
    def tearDown(self):
        pass